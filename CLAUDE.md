# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Editing Transcoder** - a desktop application built with **Tauri + Rust + TypeScript** that converts video files to editing-friendly intermediate codecs (ProRes, DNxHR) for use in Adobe Premiere Pro and After Effects.

**Key Philosophy**: Intent-driven, not parameter-driven. Users select "I want to edit," not "I want to set encoding parameters." The tool handles all ffmpeg internals automatically.

---

## Architecture

### Tech Stack
- **Frontend**: TypeScript + Web UI (Tauri)
- **Backend**: Rust (Tauri Commands)
- **Media Processing**: System-level `ffmpeg` and `ffprobe`
- **Development Platform**: Windows 10/11
### Backend Responsibilities (Rust)
- Validate ffmpeg/ffprobe availability
- Call ffprobe to extract media metadata (resolution, framerate, bit depth, chroma subsampling, audio codec)
- Generate ffmpeg commands based on presets and smart rules
- Monitor transcoding progress and stream to frontend
- Handle exceptions and errors

### Frontend Responsibilities (TypeScript)
- **Layout**: Left-right split layout with sidebar for global controls, main area for file queue
- **Components**: Modular React components with dedicated CSS files
- **State Management**: React hooks (useState, useEffect, useMemo) + custom hooks
- **File Selection**: Drag-and-drop zone and file picker dialogs
- **Preset Selection**: Compact preset grid in sidebar
- **Output File Size Estimation**: Based on metadata and segment duration
- **Progress Display**: StatusBar component showing overall batch progress
- **Error Handling**: Toast-style error messages
- **Custom Modal System**: Modal component with ESC/close-on-overlay
- **Settings Persistence**: localStorage-based settings (default preset, output directory, etc.)
- **Keyboard Shortcuts**: Ctrl+O (add files), Ctrl+, (settings), Ctrl+Enter (start), Escape (close dialogs)

---

## Output Presets

The tool supports five video output presets (user-selectable via sidebar grid):

1. **ProRes 422** (recommended) - Main editing format, intra-frame compression, 10-bit, 4:2:2 (~147 Mbps at 1080p)
2. **ProRes 422 LT** - For disk-space constrained scenarios (~102 Mbps at 1080p)
3. **ProRes 422 Proxy** - Low-bitrate proxy for offline editing (~36 Mbps at 1080p), 8-bit, 4:2:0, AAC audio
4. **DNxHR HQX** - Windows-friendly alternative, also 10-bit/4:2:2 (~295 Mbps at 1080p)
5. **H.264 CRF 18** - High quality H.264 for web sharing, 8-bit, 4:2:0, AAC audio (~25 Mbps at 1080p, variable)

### Output File Size Estimation

The frontend automatically estimates the output file size based on:
- Video duration (from ffprobe)
- Resolution (scaled from 1080p baseline)
- Selected preset bitrate

Estimation is displayed in the sidebar and updates when switching presets.

### Audio Output Strategy (Automatic)
- **Regular presets** (ProRes 422, ProRes 422 LT, DNxHR HQX): All input audio → **PCM 16-bit (uncompressed)**
- **Proxy/H.264 presets** (ProRes 422 Proxy, H.264 CRF 18): All input audio → **AAC 320kbps**
- Rationale for PCM: Native Adobe support, avoids audio decoding/compatibility issues
- Rationale for AAC: Significantly reduced file size while maintaining acceptable quality for offline editing/web sharing

---

## UI Layout Structure (v0.8+)

The application uses a left-right split layout:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header: [Editing Transcoder]          [Settings ⚙] [File Menu 📁 ▼]     │
├────────────────────────┬────────────────────────────────────────────────┤
│  Sidebar (280px)      │  Main Content Area                              │
│  ┌──────────────────┐ │  ┌──────────────────────────────────────────┐  │
│  │ Output Format    │ │  │ Queue ────────────── 5 files            │  │
│  │ [ProRes][LT][Pr] │ │  │ ┌─────────────────────────────────────┐  │  │
│  │ [DNxHR][H.264]   │ │  │ │ ⏳ video1.mp4     150 MB    [✏ ⋮]  │  │  │
│  │ Output Dir:      │ │  │ │ 0:00 - 0:30 · ProRes 422           │  │  │
│  │ [______________] │ │  │ └─────────────────────────────────────┘  │  │
│  │ Est.: ~1.7 GB    │ │  │ ┌─────────────────────────────────────┐  │  │
│  │ [+ Add Files]    │ │  │ │ ⏳ video2.mp4     450 MB    [✏ ⋮]  │  │  │
│  │ [Start (5)]      │ │  │ └─────────────────────────────────────┘  │  │
│  └──────────────────┘ │  │ ...                                     │  │
├────────────────────────┴────────────────────────────────────────────┤
│  StatusBar: Overall 0/5 completed [███████░░░░] Est. time: 5:32      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Architecture

| Component        | Location                        | Props                                                  | Responsibility                        |
| ---------------- | ------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| `SidebarPanel`   | `components/SidebarPanel.tsx`   | preset, outputDir, estimatedSize, fileCount, callbacks | Global controls for format and output |
| `FileCard`       | `components/FileCard.tsx`       | task, metadata, preset, estimatedSize, callbacks       | Single file display in queue          |
| `FileQueue`      | `components/FileQueue.tsx`      | tasks[], metadataList[], callbacks                     | Container for FileCard list           |
| `FileDropZone`   | `components/FileDropZone.tsx`   | onFilesDrop, disabled                                  | Drag-and-drop area for empty state    |
| `StatusBar`      | `components/StatusBar.tsx`      | completedCount, totalCount, failedCount, estimatedTime | Bottom progress bar                   |
| `Modal`          | `components/ui/Modal.tsx`       | isOpen, onClose, title, children, footer               | Generic modal dialog                  |
| `Dropdown`       | `components/ui/Dropdown.tsx`    | trigger, items[], align                                | Dropdown menu component               |
| `SettingsDialog` | `components/SettingsDialog.tsx` | isOpen, onClose, settings, callbacks                   | Settings modal with form              |
| `EditFileDialog` | `components/EditFileDialog.tsx` | isOpen, onClose, task, metadata, callbacks             | Per-file editing modal                |

---

## Smart Rules (Implicit - Not Exposed to User)

| Input Condition | Output Behavior                  |
| --------------- | -------------------------------- |
| 10-bit video    | Preserve 10-bit output           |
| Any framerate   | Preserve exactly (no conversion) |
| FLAC/Opus audio | Auto-convert to PCM              |
| 8-bit video     | Keep 8-bit (not upscale)         |

---

## Development Phases

- **v0.1 (MVP)**: Single file input, fixed ProRes 422 output, basic UI ✅
- **v0.2**: Auto-detect 8/10-bit, auto audio → PCM ✅
- **v0.3**: Multiple preset support (ProRes LT, DNxHR), output size estimation ✅
- **v0.4**: Batch queue, parallel transcoding, progress tracking ✅
- **v0.5**: Low-size Proxy preset with AAC audio ✅
- **v0.6**: Custom output filename editing, H.264 CRF 18 preset, code cleanup ✅
- **v0.7**: Video segment/trim transcoding with dual-handle slider and timecode input ✅
- **v0.8**: UI refactoring to left-right split layout (IN PROGRESS - see docs/UI_REFACTORING.md) ⚠️

---

## Code Quality Standards

When working on this codebase:
- Follow existing naming conventions (camelCase for TypeScript, snake_case for Rust)
- Use `task.id` as React keys, not array indices
- Extract duplicated logic into shared utility functions
- Keep frontend-backend type definitions in sync (check `types/index.ts` vs `models.rs`)
- Avoid unused variables - prefix with underscore if intentionally unused
- Each component has its own CSS file (e.g., `ComponentName.tsx` → `ComponentName.css`)
- CSS variables defined in `index.css` for consistent theming

---

## Success Criteria

Output files must work in PR/AE with:
- Direct import (no re-wrapping needed)
- Smooth timeline scrubbing
- No stuttering with standard effects applied

User should not need to understand any encoding parameters.
