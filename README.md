# Editing Transcoder

A desktop application for converting videos to editing-friendly intermediate codecs (ProRes, DNxHR) for use in Adobe Premiere Pro and After Effects.

**Design Philosophy:** Intent-driven, not parameter-driven. Users select "I want to edit," not "I want to set encoding parameters."

## Features

- **Single-click transcoding** to editing-friendly formats
- **Five output presets** with card-based selection UI:
  - **ProRes 422** (recommended) - 10-bit, 4:2:2, intra-frame compression
  - **ProRes 422 LT** - For disk-space constrained scenarios
  - **ProRes 422 Proxy** - Low-bitrate proxy for offline editing, AAC audio
  - **DNxHR HQX** - Windows-friendly alternative, 10-bit/4:2:2
  - **H.264 CRF 18** - High-quality H.264 with professional encoding settings
- **Output file size estimation** - See expected size before transcoding
- **Audio auto-conversion** to PCM (uncompressed) for Adobe compatibility (AAC for Proxy and H.264 presets)
- **Real-time progress** tracking during transcoding
- **Drag-and-drop** file selection
- **Batch transcoding** - Process multiple files in parallel
- **Bundled FFmpeg** - No external dependencies required

## Requirements

**None!** FFmpeg and FFprobe are embedded in the application. Simply download and run.

## Installation

### Download Pre-built Release

Download the latest installer from the [Releases](../../releases) page.

- **Windows:** `transcoder_0.1.0_x64-setup.exe` (~54 MB)
- **macOS:** `transcoder_0.1.0_x64.dmg` (coming soon)

### Build from Source

```bash
# Clone the repository
git clone <repository-url>
cd Transcoder

# Install dependencies
npm install

# Download FFmpeg binaries (required for building)
# Create src-tauri/binaries/windows/ directory and place:
#   - ffmpeg.exe
#   - ffprobe.exe
# Create src-tauri/binaries/darwin/ directory and place:
#   - ffmpeg
#   - ffprobe
#
# Download from: https://www.gyan.dev/ffmpeg/builds/ (Windows)
#                 https://evermeet.cx/ffmpeg/ (macOS)

# Run development server
npm run tauri dev
```

## Building for Production

```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Output Formats

| Preset | Codec | Container | Bit Depth | Chroma | Video Bitrate | Audio | Use Case |
|--------|-------|-----------|-----------|--------|---------------|-------|----------|
| ProRes 422 | prores_ks | .mov | 10-bit | 4:2:2 | ~147 Mbps (1080p) | PCM 16-bit | Main editing format (recommended) |
| ProRes 422 LT | prores_ks | .mov | 10-bit | 4:2:2 | ~102 Mbps (1080p) | PCM 16-bit | Disk-space constrained |
| ProRes 422 Proxy | prores_ks | .mov | 8-bit | 4:2:0 | ~36 Mbps (1080p) | AAC 320kbps | Proxy/offline editing, low storage |
| DNxHR HQX | dnxhd | .mov | 10-bit | 4:2:2 | ~295 Mbps (1080p) | PCM 16-bit | Windows-friendly |
| H.264 CRF 18 | libx264 | .mp4 | 8-bit | 4:2:0 | Variable | AAC 320kbps | High-quality delivery/web |

**Audio Strategy:**
- Regular presets (ProRes, DNxHR): PCM 16-bit (uncompressed) for maximum Adobe compatibility
- Proxy and H.264 presets: AAC 320kbps for reduced file size

## Smart Rules

The application automatically handles:

- **10-bit video input** → Preserves 10-bit output (except Proxy/H.264)
- **Any framerate** → Preserves exactly (no conversion)
- **FLAC/Opus audio** → Auto-converts to PCM or AAC depending on preset
- **8-bit video** → Keeps 8-bit (no upscaling)

## Usage

1. Launch the application
2. Drag and drop video file(s) or click "Browse Files" (supports multiple files for batch processing)
3. Select an output preset
4. View estimated output size (updates based on preset selection)
5. Verify or modify the output path/directory
6. Click "Start Transcode" (or "Start Batch Transcode" for multiple files)
7. Wait for progress to complete
8. Import the output file(s) into Premiere Pro or After Effects

## Project Structure

```
Transcoder/
├── src/                    # Frontend (TypeScript/React)
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript type definitions
├── src-tauri/              # Backend (Rust)
│   ├── binaries/           # FFmpeg binaries (gitignored)
│   │   ├── windows/        # Windows FFmpeg builds
│   │   └── darwin/         # macOS FFmpeg builds
│   └── src/
│       ├── commands.rs     # Tauri command handlers
│       ├── models.rs       # Data structures
│       ├── error.rs        # Error types
│       ├── preset.rs       # FFmpeg command generation
│       └── ffmpeg/         # FFmpeg integration
│           ├── embedded.rs    # Embedded binaries (rust-embed)
│           ├── locator.rs     # Binary location resolution
│           ├── validator.rs   # FFmpeg availability check
│           ├── ffprobe.rs     # Media metadata extraction
│           └── transcode.rs   # Transcoding engine
├── CLAUDE.md              # Project instructions for AI
└── plans.md               # Detailed Chinese documentation
```

## Development

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Tech Stack

- **Frontend:** TypeScript + React + Vite
- **Backend:** Rust + Tauri
- **Media Processing:** FFmpeg (embedded via rust-embed)

### Development Commands

```bash
# Development server
npm run tauri dev

# Type check frontend
npx tsc --noEmit

# Check Rust backend
cd src-tauri && cargo check

# Format Rust code
cd src-tauri && cargo fmt

# Run Rust linter
cd src-tauri && cargo clippy
```

### Architecture Notes

- **FFmpeg Distribution:** Binaries are embedded at compile time using `rust-embed`
- **Extraction:** On first run, embedded binaries are extracted to temp directory
- **Fallback:** If embedded binaries fail, the app falls back to system PATH
- **Single-file Distribution:** The final EXE contains everything needed

## Roadmap

- [x] v0.1 - MVP: Single file, ProRes 422 output
- [x] v0.2 - Smart rules: Auto-detect 8/10-bit, audio → PCM
- [x] v0.3 - Multiple preset support, output size estimation
- [x] v0.4 - Batch queue, parallel transcoding, progress tracking
- [x] v0.5 - Proxy preset with AAC audio
- [x] v0.6 - H.264 CRF 18 preset for delivery
- [x] v0.7 - Embedded FFmpeg (no external dependencies)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
