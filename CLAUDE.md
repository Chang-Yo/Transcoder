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

### Backend Responsibilities (Rust)
- Validate ffmpeg/ffprobe availability
- Call ffprobe to extract media metadata (resolution, framerate, bit depth, chroma subsampling, audio codec)
- Generate ffmpeg commands based on presets and smart rules
- Monitor transcoding progress and stream to frontend
- Handle exceptions and errors

### Frontend Responsibilities (TypeScript)
- File selection via drag-and-drop or file picker
- Preset selection UI (card-based radio buttons)
- Output file size estimation (based on metadata)
- Display transcoding progress
- Display error messages
- Auto-generate output path based on selected preset

---

## Output Presets

The tool supports three video output presets (user-selectable via card-based UI):

1. **ProRes 422** (recommended) - Main editing format, intra-frame compression, 10-bit, 4:2:2 (~147 Mbps at 1080p)
2. **ProRes 422 LT** - For disk-space constrained scenarios (~102 Mbps at 1080p)
3. **DNxHR HQX** - Windows-friendly alternative, also 10-bit/4:2:2 (~295 Mbps at 1080p)

### Output File Size Estimation

The frontend automatically estimates the output file size based on:
- Video duration (from ffprobe)
- Resolution (scaled from 1080p baseline)
- Selected preset bitrate

Estimation is displayed after selecting a file and updates when switching presets.

### Audio Output Strategy (Automatic)
- All input audio → **PCM (uncompressed)**
- Default: PCM 16-bit | Optional: PCM 24-bit
- Rationale: Native Adobe support, avoids audio decoding/compatibility issues

---

## Smart Rules (Implicit - Not Exposed to User)

| Input Condition | Output Behavior |
|----------------|-----------------|
| 10-bit video | Preserve 10-bit output |
| Any framerate | Preserve exactly (no conversion) |
| FLAC/Opus audio | Auto-convert to PCM |
| 8-bit video | Keep 8-bit (not upscale) |

---

## Development Phases

- **v0.1 (MVP)**: Single file input, fixed ProRes 422 output, basic UI ✅
- **v0.2**: Auto-detect 8/10-bit, auto audio → PCM ✅
- **v0.3**: Multiple preset support (ProRes LT, DNxHR), output size estimation ✅
- **v0.4**: Batch queue, output naming rules, basic logging

---

## Success Criteria

Output files must work in PR/AE with:
- Direct import (no re-wrapping needed)
- Smooth timeline scrubbing
- No stuttering with standard effects applied

User should not need to understand any encoding parameters.
