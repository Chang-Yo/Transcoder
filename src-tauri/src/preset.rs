use crate::models::{MediaMetadata, OutputPreset};

impl OutputPreset {
    /// Generate ffmpeg command arguments for this preset
    pub fn build_ffmpeg_args(&self, metadata: &MediaMetadata, output: &str) -> Vec<String> {
        let mut args = vec![
            "-i".to_string(), // Input
            metadata.file_path.clone(),
            "-c:v".to_string(), // Video codec
            self.video_codec(),
        ];

        // Add preset-specific video parameters
        args.extend(self.preset_args());

        // Audio: Always convert to PCM 16-bit
        args.extend(self.audio_args());

        // Output file
        args.push(output.to_string());

        // Overwrite without asking
        args.push("-y".to_string());

        args
    }

    fn video_codec(&self) -> String {
        match self {
            OutputPreset::ProRes422 => "prores_ks".to_string(),
            OutputPreset::ProRes422LT => "prores_ks".to_string(),
            OutputPreset::ProRes420Proxy => "prores_ks".to_string(),
            OutputPreset::DnxHRHQX => "dnxhd".to_string(),
        }
    }

    fn preset_args(&self) -> Vec<String> {
        match self {
            OutputPreset::ProRes422 => vec![
                "-profile:v".to_string(),
                "3".to_string(), // ProRes 422
                "-vendor".to_string(),
                "ap10".to_string(), // Apple vendor
            ],
            OutputPreset::ProRes422LT => vec![
                "-profile:v".to_string(),
                "1".to_string(), // ProRes 422 LT
                "-vendor".to_string(),
                "ap10".to_string(),
            ],
            OutputPreset::ProRes420Proxy => vec![
                "-profile:v".to_string(),
                "0".to_string(), // ProRes 422 Proxy
                "-vendor".to_string(),
                "ap10".to_string(),
                "-pix_fmt".to_string(),
                "yuv420p".to_string(), // 8-bit 4:2:0
            ],
            OutputPreset::DnxHRHQX => vec!["-profile:v".to_string(), "dnxhr_hqx".to_string()],
        }
    }

    fn audio_args(&self) -> Vec<String> {
        match self {
            // Proxy preset uses AAC for reduced file size
            OutputPreset::ProRes420Proxy => vec![
                "-c:a".to_string(),
                "aac".to_string(),
                "-b:a".to_string(),
                "320k".to_string(),
            ],
            // Other presets use PCM 16-bit for Adobe compatibility
            _ => vec!["-c:a".to_string(), "pcm_s16le".to_string()],
        }
    }
}
