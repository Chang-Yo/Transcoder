use serde::{Deserialize, Serialize};

/// Media metadata extracted from ffprobe
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaMetadata {
    pub file_path: String,
    pub duration_sec: f64,
    pub video: VideoStream,
    pub audio: Option<AudioStream>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoStream {
    pub codec: String,
    pub width: u32,
    pub height: u32,
    pub framerate: String,          // Preserve as "30000/1001" for exactness
    pub bit_depth: u8,              // 8 or 10
    pub pix_fmt: String,            // "yuv420p", "yuv422p10le", etc.
    pub chroma_subsampling: String, // "4:2:0", "4:2:2"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioStream {
    pub codec: String,
    pub sample_rate: u32,
    pub channels: u8,
}

/// Output presets for transcoding
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum OutputPreset {
    #[serde(rename = "ProRes422")]
    ProRes422,
    #[serde(rename = "ProRes422LT")]
    ProRes422LT,
    #[serde(rename = "ProRes422Proxy")]
    ProRes422Proxy,
    #[serde(rename = "DnxHRHQX")]
    DnxHRHQX,
    #[serde(rename = "H264Crf18")]
    H264Crf18,
}

/// Transcode request from frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct TranscodeRequest {
    pub input_path: String,
    pub output_path: String,
    pub preset: OutputPreset,
}

/// Progress updates sent to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscodeProgress {
    pub current_file: String,
    pub progress_percent: f64, // 0.0 to 100.0
    pub fps: Option<f64>,
    pub bitrate: Option<String>,
    pub time_elapsed: String,
    pub estimated_time: Option<String>,
}

/// FFmpeg availability check result
#[derive(Debug, Serialize, Deserialize)]
pub struct FfmpegAvailability {
    pub ffmpeg: bool,
    pub ffprobe: bool,
    /// Source of the FFmpeg binary ("system", "embedded", or "filesystem")
    #[serde(rename = "ffmpegSource")]
    pub ffmpeg_source: Option<String>,
}

/// Batch transcode request from frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct BatchTranscodeRequest {
    pub input_paths: Vec<String>,
    pub output_paths: Vec<String>,  // Full output paths for each input file
    pub preset: OutputPreset,
}

/// Batch progress with file index for tracking multiple files
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchProgress {
    pub batch_id: String,
    pub file_index: usize,
    pub total_files: usize,
    pub progress: TranscodeProgress,
}
