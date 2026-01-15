use crate::error::{CmdError, TranscodeError};

/// Find ffmpeg executable in PATH
pub fn find_ffmpeg() -> Result<String, TranscodeError> {
    which::which("ffmpeg")
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|_| TranscodeError::FfmpegNotFound)
}

/// Find ffprobe executable in PATH
pub fn find_ffprobe() -> Result<String, TranscodeError> {
    which::which("ffprobe")
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|_| TranscodeError::FfprobeNotFound)
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
