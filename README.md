# Editing Transcoder

A desktop application for converting videos to editing-friendly intermediate codecs (ProRes, DNxHR) for use in Adobe Premiere Pro and After Effects.

**Design Philosophy:** Intent-driven, not parameter-driven. Users select "I want to edit," not "I want to set encoding parameters."

## Features

- **Single-click transcoding** to editing-friendly formats
- **Four output presets** with card-based selection UI:
  - **ProRes 422** (recommended) - 10-bit, 4:2:2, intra-frame compression
  - **ProRes 422 LT** - For disk-space constrained scenarios
  - **ProRes 422 Proxy** - Low-bitrate proxy for offline editing, AAC audio
  - **DNxHR HQX** - Windows-friendly alternative, 10-bit/4:2:2
- **Output file size estimation** - See expected size before transcoding
- **Audio auto-conversion** to PCM (uncompressed) for Adobe compatibility (AAC for Proxy preset)
- **Real-time progress** tracking during transcoding
- **Drag-and-drop** file selection
- **Batch transcoding** - Process multiple files in parallel

## Requirements

- **FFmpeg** and **FFprobe** must be installed and available in your system PATH

### Installing FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg  # Ubuntu/Debian
sudo yum install ffmpeg  # Fedora/RHEL
```

Verify installation:
```bash
ffmpeg -version
ffprobe -version
```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd Transcoder

# Install dependencies
npm install

# Run development server
npm run tauri dev
```

## Building for Production

```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Output Formats

| Preset | Codec | Bit Depth | Chroma | Video Bitrate | Audio | Use Case |
|--------|-------|-----------|--------|---------------|-------|----------|
| ProRes 422 | prores_ks | 10-bit | 4:2:2 | ~147 Mbps (1080p) | PCM 16-bit | Main editing format (recommended) |
| ProRes 422 LT | prores_ks | 10-bit | 4:2:2 | ~102 Mbps (1080p) | PCM 16-bit | Disk-space constrained |
| ProRes 422 Proxy | prores_ks | 8-bit | 4:2:0 | ~36 Mbps (1080p) | AAC 320kbps | Proxy/offline editing, low storage |
| DNxHR HQX | dnxhd | 10-bit | 4:2:2 | ~295 Mbps (1080p) | PCM 16-bit | Windows-friendly |

**Audio Strategy:**
- Regular presets: PCM 16-bit (uncompressed) for maximum Adobe compatibility
- Proxy preset: AAC 320kbps for reduced file size

## Smart Rules

The application automatically handles:

- **10-bit video input** → Preserves 10-bit output
- **Any framerate** → Preserves exactly (no conversion)
- **FLAC/Opus audio** → Auto-converts to PCM
- **8-bit video** → Keeps 8-bit (no upscaling)

## Usage

1. Launch the application
2. Drag and drop video file(s) or click "Browse Files" (supports multiple files for batch processing)
3. Select an output preset (ProRes 422, ProRes 422 LT, ProRes 422 Proxy, or DNxHR HQX)
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
│   └── src/
│       ├── commands.rs     # Tauri command handlers
│       ├── models.rs       # Data structures
│       ├── error.rs        # Error types
│       ├── preset.rs       # FFmpeg command generation
│       └── ffmpeg/         # FFmpeg integration
│           ├── validator.rs    # FFmpeg availability check
│           ├── ffprobe.rs      # Media metadata extraction
│           └── transcode.rs    # Transcoding engine
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
- **Media Processing:** FFmpeg (system-level)

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

## Roadmap

- [x] v0.1 - MVP: Single file, ProRes 422 output
- [x] v0.2 - Smart rules: Auto-detect 8/10-bit, audio → PCM
- [x] v0.3 - Multiple preset support, output size estimation
- [x] v0.4 - Batch queue, parallel transcoding, progress tracking
- [ ] v0.5 - Low-size preset (Proxy) with AAC audio

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
