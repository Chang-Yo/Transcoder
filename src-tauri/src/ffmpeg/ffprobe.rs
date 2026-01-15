use crate::error::TranscodeError;
use crate::models::{AudioStream, MediaMetadata, VideoStream};
use serde_json::Value;
use std::process::Command;

pub async fn extract_metadata(file_path: &str) -> Result<MediaMetadata, Box<dyn std::error::Error>> {
    let output = Command::new("ffprobe")
        .args([
            "-hide_banner",
            "-loglevel",
            "fatal",
            "-show_streams",
            "-show_format",
            "-print_format",
            "json",
            file_path,
        ])
        .output()?;

    if !output.status.success() {
        return Err(Box::new(TranscodeError::MediaInfoFailed(
            String::from_utf8_lossy(&output.stderr).to_string(),
        )));
    }

    let json: Value = serde_json::from_slice(&output.stdout)?;
    parse_ffprobe_output(json, file_path)
}

fn parse_ffprobe_output(json: Value, file_path: &str) -> Result<MediaMetadata, Box<dyn std::error::Error>> {
    let streams = json["streams"]
        .as_array()
        .ok_or("No streams found in output")?;

    let mut video_stream = None;
    let mut audio_stream = None;

    for stream in streams {
        let codec_type = stream["codec_type"].as_str().unwrap_or("");

        match codec_type {
            "video" => {
                video_stream = Some(parse_video_stream(stream)?);
            }
            "audio" => {
                audio_stream = Some(parse_audio_stream(stream)?);
            }
            _ => {}
        }
    }

    let duration = json["format"]["duration"]
        .as_str()
        .and_then(|s| s.parse().ok())
        .unwrap_or(0.0);

    Ok(MediaMetadata {
        file_path: file_path.to_string(),
        duration_sec: duration,
        video: video_stream.ok_or("No video stream found")?,
        audio: audio_stream,
    })
}

fn parse_video_stream(stream: &Value) -> Result<VideoStream, Box<dyn std::error::Error>> {
    let pix_fmt = stream["pix_fmt"].as_str().unwrap_or("yuv420p").to_string();
    let bit_depth = extract_bit_depth(&pix_fmt, stream);

    // Parse framerate from "r_frame_rate" (e.g., "30000/1001")
    let framerate = stream["r_frame_rate"].as_str().unwrap_or("25/1").to_string();

    // Determine chroma subsampling from pix_fmt
    let chroma_subsampling = chroma_from_pix_fmt(&pix_fmt);

    Ok(VideoStream {
        codec: stream["codec_name"].as_str().unwrap_or("unknown").to_string(),
        width: stream["width"].as_u64().unwrap_or(1920) as u32,
        height: stream["height"].as_u64().unwrap_or(1080) as u32,
        framerate,
        bit_depth,
        pix_fmt,
        chroma_subsampling,
    })
}

fn parse_audio_stream(stream: &Value) -> Result<AudioStream, Box<dyn std::error::Error>> {
    Ok(AudioStream {
        codec: stream["codec_name"].as_str().unwrap_or("unknown").to_string(),
        sample_rate: stream["sample_rate"]
            .as_str()
            .and_then(|s| s.parse().ok())
            .unwrap_or(48000),
        channels: stream["channels"].as_u64().unwrap_or(2) as u8,
    })
}

fn extract_bit_depth(pix_fmt: &str, stream: &Value) -> u8 {
    // First check bits_per_raw_sample
    if let Some(bits) = stream["bits_per_raw_sample"].as_u64() {
        return bits as u8;
    }

    // Otherwise infer from pixel format
    if pix_fmt.ends_with("10le") || pix_fmt.ends_with("10be") {
        10
    } else if pix_fmt.ends_with("12le") || pix_fmt.ends_with("12be") {
        12
    } else {
        8 // Default to 8-bit
    }
}

fn chroma_from_pix_fmt(pix_fmt: &str) -> String {
    if pix_fmt.contains("420") {
        "4:2:0".to_string()
    } else if pix_fmt.contains("422") {
        "4:2:2".to_string()
    } else if pix_fmt.contains("444") {
        "4:4:4".to_string()
    } else {
        "4:2:0".to_string() // Default
    }
}
