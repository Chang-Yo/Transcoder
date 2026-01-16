use std::env;
use std::path::PathBuf;

/// FFmpeg source for user notification
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FfmpegSource {
    System,
    Filesystem,
}

/// Get the path to the ffmpeg executable with source information
pub fn get_ffmpeg_path_with_source() -> Result<(PathBuf, FfmpegSource), String> {
    // First, try system PATH (priority)
    if let Ok(path) = which::which("ffmpeg") {
        return Ok((path, FfmpegSource::System));
    }

    // Then try filesystem bundled version (in ffmpeg/ subdirectory)
    if let Some(exe_path) = get_filesystem_binary("ffmpeg.exe") {
        return Ok((exe_path, FfmpegSource::Filesystem));
    }

    Err("ffmpeg not found".to_string())
}

/// Get the path to the bundled ffmpeg executable
pub fn get_ffmpeg_path() -> Result<PathBuf, String> {
    get_ffmpeg_path_with_source()
        .map(|(path, _)| path)
}

/// Get the path to the ffprobe executable with source information
pub fn get_ffprobe_path_with_source() -> Result<(PathBuf, FfmpegSource), String> {
    // First, try system PATH (priority)
    if let Ok(path) = which::which("ffprobe") {
        return Ok((path, FfmpegSource::System));
    }

    // Then try filesystem bundled version (in ffmpeg/ subdirectory)
    if let Some(exe_path) = get_filesystem_binary("ffprobe.exe") {
        return Ok((exe_path, FfmpegSource::Filesystem));
    }

    Err("ffprobe not found".to_string())
}

/// Get the path to the bundled ffprobe executable
pub fn get_ffprobe_path() -> Result<PathBuf, String> {
    get_ffprobe_path_with_source()
        .map(|(path, _)| path)
}

/// Get path to filesystem binary (in ffmpeg/ subdirectory)
fn get_filesystem_binary(name: &str) -> Option<PathBuf> {
    // In development, look in binaries/windows/ directory
    let dev_path = PathBuf::from("binaries")
        .join("windows")
        .join(name);

    if dev_path.exists() {
        return Some(dev_path);
    }

    // In production, look in ffmpeg/ subdirectory alongside the executable
    if let Some(exe_dir) = get_exe_dir() {
        let ffmpeg_dir = exe_dir.join("ffmpeg");
        let prod_path = ffmpeg_dir.join(name);
        if prod_path.exists() {
            return Some(prod_path);
        }
    }

    None
}

fn get_exe_dir() -> Option<PathBuf> {
    env::current_exe().ok().and_then(|path| {
        path.parent().map(|p| p.to_path_buf())
    })
}
