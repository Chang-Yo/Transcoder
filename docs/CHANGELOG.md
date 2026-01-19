# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.2] - 2025-01-19

### Added
- Apply new icon for app

### Changed
- Updated README documentation to match actual implementation:
  - Corrected button names and UI element descriptions
  - Added interface layout diagram
  - Added keyboard shortcuts documentation

## [0.5.1] - 2025-01-19

### Added
- Custom logo design with cyan color scheme (#4AA3C0, #9BE1F3)
- Logo icons generated for GitHub Pages showcase site
- Dark mode set as default theme for showcase website

### Changed
- Renamed product from "Editing Transcoder" to "Transcoder" across all files
- Updated GitHub Pages showcase site with new visual design:
  - Cyan color scheme matching logo
  - Professional Lucide React icons replacing emoji
  - New Showcase section with app preview mockup
  - Logo integrated in Hero, Header, and Footer components
- Updated app window title, metadata, and documentation

### Fixed
- Time range export now respects the specified start time when trimming

## [0.5.0] - 2025-01-19

### Added
- File folder emoji icon (📁) in empty drag-drop zone
- Slider hint text "(drag handles to adjust)" next to Enable time range checkbox

### Changed
- Time range slider handles — now pure black circles (24px) for better visibility
- Time range visual design — gray track (total duration) + blue fill (selected range)
- FileCard — removed per-file preset display (now managed globally in sidebar)
- Enhanced file size display — larger font and bolder weight
- Input fields — added shadows for better visual hierarchy
- Metadata items — added shadows for better visual hierarchy

### Fixed
- Slider thumb visibility — handles now clearly visible against any background
- Empty drag-drop zone now shows visual indicator instead of blank space

## [0.4.0] - 2025-01-18

### Changed
- Renamed from "IN PROGRESS" to release version 0.4.0

## [0.3.1] - IN PROGRESS

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
