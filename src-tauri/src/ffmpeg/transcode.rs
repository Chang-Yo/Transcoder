use crate::error::TranscodeError;
use crate::ffmpeg::ffprobe;
use crate::models::{BatchProgress, TranscodeProgress, TranscodeRequest};
use std::io::BufRead;
use std::process::{Command, Stdio};
use std::thread;
use tauri::Window;

pub fn spawn_transcode_job(
    job_id: String,
    request: TranscodeRequest,
    window: Window,
) -> Result<(), TranscodeError> {
    thread::spawn(move || {
        let result = run_transcode(&job_id, &request, &window);

        // Emit completion event
        let event = if result.is_ok() {
            "transcode-complete"
        } else {
            "transcode-error"
        };

        let _ = window.emit(event, job_id);
    });

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
    thread::spawn(move || {
        let result = run_batch_transcode(
            &batch_id,
            file_index,
            total_files,
            &request,
            &window,
        );

        // Emit completion event with batch info
        let event = if result.is_ok() {
            "batch-transcode-complete"
        } else {
            "batch-transcode-error"
        };

        let _ = window.emit(event, (batch_id, file_index));
    });

    Ok(())
}

fn run_transcode(
    _job_id: &str,
    request: &TranscodeRequest,
    window: &Window,
) -> Result<(), TranscodeError> {
    // First, get metadata for duration calculation
    let rt = tokio::runtime::Runtime::new()?;
    let metadata = rt.block_on(ffprobe::extract_metadata(&request.input_path))
        .map_err(|e| TranscodeError::MediaInfoFailed(e.to_string()))?;

    // Build ffmpeg command from preset
    let args = request.preset.build_ffmpeg_args(&metadata, &request.output_path);

    // Spawn ffmpeg with stderr piped for progress parsing
    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| TranscodeError::TranscodeFailed(e.to_string()))?;

    // Parse progress from stderr
    let stderr = child
        .stderr
        .take()
        .ok_or(TranscodeError::TranscodeFailed("No stderr".to_string()))?;
    let reader = std::io::BufReader::new(stderr);

    for line in reader.lines() {
        let line = line.map_err(|e| TranscodeError::TranscodeFailed(e.to_string()))?;

        if let Some(progress) = parse_ffmpeg_progress(&line, &metadata) {
            let _ = window.emit("transcode-progress", progress);
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

/// Run transcode for batch processing with batch_id and file_index
fn run_batch_transcode(
    batch_id: &str,
    file_index: usize,
    _total_files: usize,
    request: &TranscodeRequest,
    window: &Window,
) -> Result<(), TranscodeError> {
    // First, get metadata for duration calculation
    let rt = tokio::runtime::Runtime::new()?;
    let metadata = rt.block_on(ffprobe::extract_metadata(&request.input_path))
        .map_err(|e| TranscodeError::MediaInfoFailed(e.to_string()))?;

    // Build ffmpeg command from preset
    let args = request.preset.build_ffmpeg_args(&metadata, &request.output_path);

    // Spawn ffmpeg with stderr piped for progress parsing
    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| TranscodeError::TranscodeFailed(e.to_string()))?;

    // Parse progress from stderr
    let stderr = child
        .stderr
        .take()
        .ok_or(TranscodeError::TranscodeFailed("No stderr".to_string()))?;
    let reader = std::io::BufReader::new(stderr);

    for line in reader.lines() {
        let line = line.map_err(|e| TranscodeError::TranscodeFailed(e.to_string()))?;

        if let Some(progress) = parse_ffmpeg_progress(&line, &metadata) {
            let batch_progress = BatchProgress {
                batch_id: batch_id.to_string(),
                file_index,
                total_files: _total_files,
                progress,
            };
            let _ = window.emit("batch-transcode-progress", batch_progress);
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

/// Parse ffmpeg progress output.
/// Example line: frame= 123 fps=25 q=12.0 size= 12345kB time=00:00:05.00 bitrate= 1234.5kbits/s speed=1.00x
fn parse_ffmpeg_progress(line: &str, metadata: &crate::models::MediaMetadata) -> Option<TranscodeProgress> {
    if !line.contains("frame=") {
        return None;
    }

    let time_str = extract_value(line, "time=")?;
    let fps = extract_value(line, "fps=").and_then(|s| s.parse().ok());
    let bitrate = extract_value(line, "bitrate=").map(|s| s.to_string());

    // Calculate progress percentage based on time vs duration
    let elapsed_seconds = parse_time_string(&time_str)?;
    let progress = if metadata.duration_sec > 0.0 {
        (elapsed_seconds / metadata.duration_sec) * 100.0
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
