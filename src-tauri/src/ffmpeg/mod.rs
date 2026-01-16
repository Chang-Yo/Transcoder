pub mod locator;
pub use locator::FfmpegSource;
pub mod validator;
pub mod ffprobe;
pub mod transcode;

/// Extension trait to spawn processes without console window on Windows
pub trait SpawnNoConsole {
    fn spawn_no_console(&mut self) -> Result<std::process::Child, std::io::Error>;
    fn output_no_console(&mut self) -> Result<std::process::Output, std::io::Error>;
}

impl SpawnNoConsole for std::process::Command {
    fn spawn_no_console(&mut self) -> Result<std::process::Child, std::io::Error> {
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            // CREATE_NO_WINDOW = 0x08000000 - prevents creating a console window
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            self.creation_flags(CREATE_NO_WINDOW).spawn()
        }
        #[cfg(not(windows))]
        self.spawn()
    }

    fn output_no_console(&mut self) -> Result<std::process::Output, std::io::Error> {
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            // CREATE_NO_WINDOW = 0x08000000 - prevents creating a console window
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            self.creation_flags(CREATE_NO_WINDOW).output()
        }
        #[cfg(not(windows))]
        self.output()
    }
}
