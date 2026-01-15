use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "binaries/windows/"]
pub struct FfmpegBinaries;
