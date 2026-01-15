use serde::{Serialize, Deserialize};

/// Errors that can occur during transcoding
#[derive(Debug, thiserror::Error)]
pub enum TranscodeError {
    #[error("ffmpeg not found: {0}")]
    FfmpegNotFound(String),

    #[error("ffprobe not found: {0}")]
    FfprobeNotFound(String),

    #[error("Failed to read media info: {0}")]
    MediaInfoFailed(String),

    #[error("Transcoding failed: {0}")]
    TranscodeFailed(String),

    #[error("Invalid input file: {0}")]
    InvalidInput(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("JSON parsing error: {0}")]
    JsonError(#[from] serde_json::Error),
}

/// Tauri-compatible error type for commands
#[derive(Debug, Serialize, Deserialize)]
pub struct CmdError {
    pub message: String,
}

impl From<TranscodeError> for CmdError {
    fn from(err: TranscodeError) -> Self {
        CmdError {
            message: err.to_string(),
        }
    }
}
