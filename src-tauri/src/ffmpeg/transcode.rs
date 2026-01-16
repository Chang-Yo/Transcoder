use crate::error::TranscodeError;
use crate::ffmpeg::ffprobe;
use crate::ffmpeg::SpawnNoConsole;
use crate::models::{BatchProgress, TimeSegment, TranscodeProgress, TranscodeRequest};
use std::io::BufRead;
use std::process::{Command, Stdio};
use std::thread;
use tauri::Window;

/// Progress event type for different transcode modes
enum ProgressMode {
    Single,
    Batch { batch_id: String, file_index: usize, total_files: usize },
}

pub fn spawn_transcode_job(
    _job_id: String,
    request: TranscodeRequest,
    window: Window,
) -> Result<(), TranscodeError> {
    spawn_transcode_with_mode(request, window, ProgressMode::Single);
    Ok(())
}

/// Spawn a transcode job for batch processing with file index tracking
pub fn spawn_batch_transcode_job(
    batch_id: String,
    file_index: usize,
    total_files: usize,
    request: TranscodeRequest,
    window: Window,
) -> Result<(), TranscodeError> {
    spawn_transcode_with_mode(
        request,
        window,
        ProgressMode::Batch { batch_id, file_index, total_files },
    );
    Ok(())
}

/// Core spawn function that handles both single and batch transcode
fn spawn_transcode_with_mode(request: TranscodeRequest, window: Window, mode: ProgressMode) {
    thread::spawn(move || {
        let result = execute_transcode(&request, &window, &mode);

        // Emit completion event based on mode
        match mode {
            ProgressMode::Single => {
                let event = if result.is_ok() {
                    "transcode-complete"
                } else {
                    "transcode-error"
                };
                let _ = window.emit(event, request.input_path);
            }
            ProgressMode::Batch {
                batch_id,
                file_index,
                ..
            } => {
                let event = if result.is_ok() {
                    "batch-transcode-complete"
                } else {
                    "batch-transcode-error"
                };
                let _ = window.emit(event, (batch_id, file_index));
            }
        }
    });
}

/// Execute the transcode process with progress reporting
fn execute_transcode(
    request: &TranscodeRequest,
    window: &Window,
    mode: &ProgressMode,
) -> Result<(), TranscodeError> {
    // Get metadata for duration calculation
    let rt = tokio::runtime::Runtime::new()?;
    let metadata = rt
        .block_on(ffprobe::extract_metadata(&request.input_path))
        .map_err(|e| TranscodeError::MediaInfoFailed(e.to_string()))?;

    // Build ffmpeg command from preset (with segment support)
    let args = request
        .preset
        .build_ffmpeg_args(&metadata, &request.output_path, request.segment.as_ref());

    // Spawn ffmpeg with stderr piped for progress parsing (no console window)
    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stderr(Stdio::piped())
        .spawn_no_console()
        .map_err(|e| TranscodeError::TranscodeFailed(e.to_string()))?;

    // Parse progress from stderr
    let stderr = child
        .stderr
        .take()
        .ok_or(TranscodeError::TranscodeFailed("No stderr".to_string()))?;
    let reader = std::io::BufReader::new(stderr);

    for line in reader.lines() {
        let line = line.map_err(|e| TranscodeError::TranscodeFailed(e.to_string()))?;

        if let Some(progress) = parse_ffmpeg_progress(&line, &metadata, request.segment.as_ref()) {
            emit_progress(window, mode, progress);
        }
    }

    let status = child
        .wait()
        .map_err(|e| TranscodeError::TranscodeFailed(e.to_string()))?;

    if !status.success() {
        return Err(TranscodeError::TranscodeFailed(
            "ffmpeg returned non-zero exit code".to_string(),
        ));
    }

    Ok(())
}

/// Emit progress event based on the current mode
fn emit_progress(window: &Window, mode: &ProgressMode, progress: TranscodeProgress) {
    match mode {
        ProgressMode::Single => {
            let _ = window.emit("transcode-progress", progress);
        }
        ProgressMode::Batch {
            batch_id,
            file_index,
            total_files,
        } => {
            let batch_progress = BatchProgress {
                batch_id: batch_id.clone(),
                file_index: *file_index,
                total_files: *total_files,
                progress,
            };
            let _ = window.emit("batch-transcode-progress", batch_progress);
        }
    }
}

/// Parse ffmpeg progress output.
/// Example line: frame= 123 fps=25 q=12.0 size= 12345kB time=00:00:05.00 bitrate= 1234.5kbits/s speed=1.00x
fn parse_ffmpeg_progress(
    line: &str,
    metadata: &crate::models::MediaMetadata,
    segment: Option<&TimeSegment>,
) -> Option<TranscodeProgress> {
    if !line.contains("frame=") {
        return None;
    }

    let time_str = extract_value(line, "time=")?;
    let fps = extract_value(line, "fps=").and_then(|s| s.parse().ok());
    let bitrate = extract_value(line, "bitrate=").map(|s| s.to_string());

    // Calculate progress percentage based on segment duration
    let elapsed_seconds = parse_time_string(&time_str)?;

    // Determine effective duration for progress calculation
    let (segment_start, effective_duration) = if let Some(seg) = segment {
        let end = seg.end_sec.unwrap_or(metadata.duration_sec);
        (seg.start_sec, end - seg.start_sec)
    } else {
        (0.0, metadata.duration_sec)
    };

    // Adjust elapsed time relative to segment start
    let effective_elapsed = elapsed_seconds - segment_start;

    let progress = if effective_duration > 0.0 {
        ((effective_elapsed / effective_duration) * 100.0).max(0.0)
    } else {
        0.0
    };

    Some(TranscodeProgress {
        current_file: metadata.file_path.clone(),
        progress_percent: progress.min(100.0),
        fps,
        bitrate,
        time_elapsed: time_str,
        estimated_time: None,
    })
}

/// Extract a value from ffmpeg progress line by key
/// e.g., extract_value(line, "time=") -> Some("00:00:05.00")
fn extract_value(line: &str, key: &str) -> Option<String> {
    let start = line.find(key)? + key.len();
    let end = line[start..]
        .find(' ')
        .or_else(|| line[start..].find('\t'))
        .unwrap_or(line[start..].len());
    Some(line[start..start + end].to_string())
}

/// Parse ffmpeg time string to seconds
/// e.g., "00:01:23.45" -> 83.45
fn parse_time_string(time_str: &str) -> Option<f64> {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() != 3 {
        return None;
    }

    let hours: f64 = parts[0].parse().ok()?;
    let minutes: f64 = parts[1].parse().ok()?;
    let seconds: f64 = parts[2].parse().ok()?;

    Some(hours * 3600.0 + minutes * 60.0 + seconds)
}
