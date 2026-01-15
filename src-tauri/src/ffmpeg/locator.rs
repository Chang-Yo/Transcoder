use crate::ffmpeg::embedded::FfmpegBinaries;
use std::env;
use std::fs;
use std::path::PathBuf;

/// Get the path to the bundled ffmpeg executable
pub fn get_ffmpeg_path() -> Result<PathBuf, String> {
    // First, try embedded binaries
    if let Ok(path) = get_embedded_binary("ffmpeg.exe") {
        return Ok(path);
    }

    // Then try filesystem bundled version
    if let Some(exe_path) = get_filesystem_binary("ffmpeg.exe") {
        return Ok(exe_path);
    }

    // Fall back to system PATH
    which::which("ffmpeg")
        .map_err(|_| "ffmpeg not found in system PATH".to_string())
}

/// Get the path to the bundled ffprobe executable
pub fn get_ffprobe_path() -> Result<PathBuf, String> {
    // First, try embedded binaries
    if let Ok(path) = get_embedded_binary("ffprobe.exe") {
        return Ok(path);
    }

    // Then try filesystem bundled version
    if let Some(exe_path) = get_filesystem_binary("ffprobe.exe") {
        return Ok(exe_path);
    }

    // Fall back to system PATH
    which::which("ffprobe")
        .map_err(|_| "ffprobe not found in system PATH".to_string())
}

/// Extract embedded binary to temp directory and return its path
fn get_embedded_binary(name: &str) -> Result<PathBuf, String> {
    // Try to get the file from embedded assets
    let embedded_file = FfmpegBinaries::get(name)
        .ok_or_else(|| format!("{} not found in embedded binaries", name))?;

    // Create a temp directory for extracted binaries
    let temp_dir = env::temp_dir()
        .join("transcoder-ffmpeg");

    // Ensure temp directory exists
    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp directory: {}", e))?;

    let output_path = temp_dir.join(name);

    // Only extract if it doesn't exist or is different
    let needs_extraction = if output_path.exists() {
        // Check size to see if we need to re-extract
        let current_size = fs::metadata(&output_path)
            .map(|m| m.len())
            .unwrap_or(0);
        current_size != embedded_file.data.len() as u64
    } else {
        true
    };

    if needs_extraction {
        fs::write(&output_path, embedded_file.data)
            .map_err(|e| format!("Failed to write {}: {}", name, e))?;
    }

    Ok(output_path)
}

/// Get path to filesystem binary (for dev mode or legacy installs)
fn get_filesystem_binary(name: &str) -> Option<PathBuf> {
    // In development, look in binaries/ directory
    let dev_path = PathBuf::from("binaries")
        .join("windows")
        .join(name);

    if dev_path.exists() {
        return Some(dev_path);
    }

    // In production, look alongside the executable
    if let Some(exe_dir) = get_exe_dir() {
        let prod_path = exe_dir.join(name);
        if prod_path.exists() {
            return Some(prod_path);
        }

        // Check resources subdirectory (NSIS installer structure)
        let resource_path = exe_dir.join("resources").join("binaries").join("windows").join(name);
        if resource_path.exists() {
            return Some(resource_path);
        }
    }

    None
}

fn get_exe_dir() -> Option<PathBuf> {
    env::current_exe().ok().and_then(|path| {
        path.parent().map(|p| p.to_path_buf())
    })
}
