use crate::error::{CmdError, TranscodeError};
use crate::ffmpeg::{self, transcode, validator, FfmpegSource};
use crate::models::{BatchTranscodeRequest, FfmpegAvailability, MediaMetadata, TranscodeRequest};
use tauri::Window;

/// Check if ffmpeg and ffprobe are available on the system
#[tauri::command]
pub async fn check_ffmpeg_available() -> Result<FfmpegAvailability, CmdError> {
    let ffmpeg_ok = validator::find_ffmpeg().is_ok();
    let ffprobe_ok = validator::find_ffprobe().is_ok();

    // Get the FFmpeg source for notification
    let ffmpeg_source = if ffmpeg_ok {
        match crate::ffmpeg::locator::get_ffmpeg_path_with_source() {
            Ok((_path, source)) => Some(source_to_string(source)),
            Err(_) => None,
        }
    } else {
        None
    };

    Ok(FfmpegAvailability {
        ffmpeg: ffmpeg_ok,
        ffprobe: ffprobe_ok,
        ffmpeg_source,
    })
}

fn source_to_string(source: FfmpegSource) -> String {
    match source {
        FfmpegSource::System => "system".to_string(),
        FfmpegSource::Filesystem => "filesystem".to_string(),
    }
}

/// Extract metadata from a video file using ffprobe
#[tauri::command]
pub async fn get_media_info(file_path: String) -> Result<MediaMetadata, CmdError> {
    validator::ensure_ffprobe()?;
    Ok(ffmpeg::ffprobe::extract_metadata(&file_path).await?)
}

/// Start transcoding - returns immediately, progress sent via events
#[tauri::command]
pub async fn start_transcode(
    request: TranscodeRequest,
    window: Window,
) -> Result<String, CmdError> {
    validator::ensure_ffmpeg()?;

    // Generate a job ID
    let job_id = uuid::Uuid::new_v4().to_string();

    // Start transcode in background task
    transcode::spawn_transcode_job(job_id.clone(), request, window)?;

    Ok(job_id)
}

/// Start batch transcoding - all files start in parallel, progress sent via events
#[tauri::command]
pub async fn start_batch_transcode(
    request: BatchTranscodeRequest,
    window: Window,
) -> Result<String, CmdError> {
    validator::ensure_ffmpeg()?;

    if request.input_paths.is_empty() {
        return Err(TranscodeError::InvalidInput("No files provided".to_string()).into());
    }

    // Generate a batch ID
    let batch_id = uuid::Uuid::new_v4().to_string();
    let total_files = request.input_paths.len();

    // Start transcode job for each file in parallel
    for (index, input_path) in request.input_paths.iter().enumerate() {
        let file_index = index;
        let total = total_files;
        let batch_id_clone = batch_id.clone();
        let window_clone = window.clone();

        // Generate output path for this file
        let file_name = std::path::Path::new(input_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("output");
        let suffix = match request.preset {
            crate::models::OutputPreset::ProRes422 => "_prores",
            crate::models::OutputPreset::ProRes422LT => "_proreslt",
            crate::models::OutputPreset::ProRes422Proxy => "_proxy",
            crate::models::OutputPreset::DnxHRHQX => "_dnxhr",
            crate::models::OutputPreset::H264Crf18 => "_h264",
        };
        let ext = match request.preset {
            crate::models::OutputPreset::H264Crf18 => "mp4",
            _ => "mov",
        };
        let output_path = format!(
            "{}/{}{}.{}",
            request.output_dir.trim_end_matches('/'),
            file_name,
            suffix,
            ext
        );

        let transcode_request = TranscodeRequest {
            input_path: input_path.clone(),
            output_path,
            preset: request.preset,
        };

        // Spawn each file in its own thread
        transcode::spawn_batch_transcode_job(
            batch_id_clone,
            file_index,
            total,
            transcode_request,
            window_clone,
        )?;
    }

    Ok(batch_id)
}
