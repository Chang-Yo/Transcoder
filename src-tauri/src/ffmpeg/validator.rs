use crate::error::{CmdError, TranscodeError};
use crate::ffmpeg::locator;

/// Find ffmpeg executable (bundled or system PATH)
pub fn find_ffmpeg() -> Result<String, TranscodeError> {
    locator::get_ffmpeg_path()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| TranscodeError::FfmpegNotFound(e))
}

/// Find ffprobe executable (bundled or system PATH)
pub fn find_ffprobe() -> Result<String, TranscodeError> {
    locator::get_ffprobe_path()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| TranscodeError::FfprobeNotFound(e))
}

/// Ensure ffmpeg is available
pub fn ensure_ffmpeg() -> Result<(), CmdError> {
    find_ffmpeg()?;
    Ok(())
}

/// Ensure ffprobe is available
pub fn ensure_ffprobe() -> Result<(), CmdError> {
    find_ffprobe()?;
    Ok(())
}
