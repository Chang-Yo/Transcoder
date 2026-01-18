use serde::{Deserialize, Serialize};

/// Time segment for partial transcoding
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TimeSegment {
    /// Start time in seconds
    pub start_sec: f64,
    /// End time in seconds, None means to the end of video
    pub end_sec: Option<f64>,
}

impl TimeSegment {
    /// Validate if segment is within video duration
    pub fn is_valid(&self, duration_sec: f64) -> bool {
        if self.start_sec < 0.0 {
            return false;
        }
        if self.start_sec >= duration_sec {
            return false;
        }
        if let Some(end) = self.end_sec {
            if end <= self.start_sec {
                return false;
            }
            // Allow end to exceed duration slightly (ffmpeg will handle it)
        }
        true
    }

    /// Get segment duration in seconds
    pub fn duration(&self, total_duration: f64) -> f64 {
        let end = self.end_sec.unwrap_or(total_duration);
        end.min(total_duration) - self.start_sec
    }

    /// Clamp segment to be within video duration
    pub fn clamp(&self, duration_sec: f64) -> Self {
        let start_sec = self.start_sec.clamp(0.0, duration_sec - 0.1);
        let end_sec = self.end_sec.map(|end| end.clamp(start_sec + 0.1, duration_sec));
        Self { start_sec, end_sec }
    }
}

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
    /// Optional time segment - None means transcode the entire video
    #[serde(rename = "segment")]
    pub segment: Option<TimeSegment>,
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
    /// Optional time segment for each input file
    #[serde(rename = "segments")]
    pub segments: Option<Vec<Option<TimeSegment>>>,
}

/// Batch progress with file index for tracking multiple files
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchProgress {
    pub batch_id: String,
    pub file_index: usize,
    pub total_files: usize,
    pub progress: TranscodeProgress,
}
