# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - IN PROGRESS

### Added
- **Left-right split layout** — sidebar with controls, main area with file queue
- **StatusBar component** — bottom status bar showing overall progress
- **Settings dialog** — persistent settings via localStorage
- **Keyboard shortcuts** — Ctrl+O (add files), Ctrl+, (settings), Ctrl+Enter (start), Escape (close dialogs)
- **File menu dropdown** — header dropdown for file operations
- **Compact file cards** — streamlined queue item display
- **Modal system** — reusable modal component with focus trap
- **Toast-style error messages** — floating error notifications
- **Preset Details section** — displays codec, audio, color depth, chroma, and bitrate info for selected preset
- **Clear Completed button** — removes completed files from queue while keeping pending/failed ones
- **Immediate Processing status** — all files show "Processing" status immediately when Start is clicked

### Changed
- Preset selection moved from main area to sidebar grid
- Output directory and file count displayed in sidebar
- All components now have dedicated CSS files

### Fixed
- FileCard expansion scrolling — expanded card content now fully visible and scrollable with mouse wheel
- Time range slider handles — added dedicated CSS file with custom thumb styling, handles now remain fully visible when dragged (no more "swallowing" issue)
- Missing `name` property in `PRESET_INFO` — added display names to all preset objects
- Non-null assertion overuse in FileCard — refactored to avoid unnecessary `!` operators
- Magic numbers in size estimation — extracted to named constants (`BASELINE_PIXELS`, `BITS_PER_BYTE`, `BYTES_PER_MB`)
- Unused `taskDurations` prop — removed from FileQueue component
- Inconsistent pluralization — now uses `pluralize()` utility throughout app

### Known Issues
- UI refactoring in progress — see docs/UI_REFACTORING.md for details

## [0.3.0] - 2025-01-16

### Added
- **Video segment trimming** — trim videos to selected time ranges before transcoding
- Dual-handle slider with visual time range selection
- Manual timecode input support (HH:MM:SS format)
- Real-time segment duration display
- Default 30-second segment when trim is enabled

### Changed
- File size estimation now accounts for segment duration
- Progress calculation based on segment duration when trimming

### Fixed
- Slider thumb visibility issue — thumbs now remain fully visible when dragged

## [0.2.1] - 2025-01-16

### Added
- Custom output filename editing — users can now edit the output filename before transcoding
- File extension and suffix remain read-only, automatically managed by selected preset

### Changed
- Improved UI for better user experience

## [0.2.0] - 2025-01-16

### Added
- Zip distribution format — extract and run without installation
- FFmpeg binaries stored separately in `ffmpeg/` folder for easier maintenance

### Changed
- Main executable size reduced from ~195 MB to ~6 MB
- FFmpeg detection priority: System PATH → bundled (ffmpeg/)
- Simplified distribution — single zip file instead of multiple installers

### Removed
- NSIS installer distribution
- Embedded FFmpeg (rust-embed)

## [0.1.0] - 2025-01-15

### Added
- Initial release
- ProRes 422 family presets (422, 422 LT, 422 Proxy)
- DNxHR HQX preset
- H.264 CRF 18 preset for delivery
- Batch transcoding with parallel processing
- Real-time progress tracking
- File size estimation
- Drag and drop support (files and folders)
- Embedded FFmpeg (no external dependencies required)
