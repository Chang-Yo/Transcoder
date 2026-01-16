---
name: app-package
description: Windows Tauri application packaging skill. Builds the release version and creates a zip distribution with FFmpeg binaries in the ffmpeg/ subdirectory. Outputs to dist-release/ folder.
license: MIT
metadata:
  author: Transcoder
  version: "1.0.0"
---

# App Package Skill

Builds and packages the Editing Transcoder Windows application for distribution.

## When to Use

Call this skill when:
- User wants to create a release build
- User wants to package the app for distribution
- User invokes `/app-package` command

## Packaging Process

1. **Ask for confirmation and version info**
   - Ask user for version number (default: current version from Cargo.toml)
   - Confirm before proceeding

2. **Update version files** (if version changed)
   - `src-tauri/Cargo.toml` - update `version` field
   - `src-tauri/tauri.conf.json` - update `package.version` field

3. **Build release**
   ```bash
   npm run tauri build
   ```

4. **Create distribution package**
   - Create `dist-release/` directory
   - Create `dist-release/ffmpeg/` subdirectory
   - Copy `src-tauri/target/release/transcoder.exe`
   - Copy `src-tauri/binaries/windows/ffmpeg.exe` to `ffmpeg/`
   - Copy `src-tauri/binaries/windows/ffprobe.exe` to `ffmpeg/`
   - Copy `README.md`

5. **Create zip archive**
   ```bash
   powershell -Command "Compress-Archive -Path dist-release\* -DestinationPath dist-release/transcoder-v{version}-windows.zip"
   ```
6. **Update the Docs
   - changelog
   - readme
   
   You should never add the Claude's cowork name in the commit message.
7. **Commit changes**
   ```bash
   git add .
   git commit -m "Release v{version}"
   ```

## Output Structure

```
dist-release/
├── transcoder.exe          (5-6 MB)
├── ffmpeg/
│   ├── ffmpeg.exe
│   └── ffprobe.exe
├── README.md
└── transcoder-v{version}-windows.zip
```

## Files Modified

- `src-tauri/Cargo.toml` - version
- `src-tauri/tauri.conf.json` - version

## Files Created

- `dist-release/transcoder-v{version}-windows.zip` - distribution package
