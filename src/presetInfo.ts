import { PRESET_BITRATE, PRESET_DISPLAY_NAMES, type OutputPreset } from "./types";

// Preset parameters for detailed display
export interface PresetParameters {
  codec: string;
  audio: string;
  colorDepth: string;
  chroma: string;
  bitrate: string;
}

export const PRESET_PARAMETERS: Record<OutputPreset, PresetParameters> = {
  ProRes422: {
    codec: "ProRes 422",
    audio: "PCM 16-bit",
    colorDepth: "10-bit",
    chroma: "4:2:2",
    bitrate: "~147 Mbps @1080p"
  },
  ProRes422LT: {
    codec: "ProRes 422 LT",
    audio: "PCM 16-bit",
    colorDepth: "10-bit",
    chroma: "4:2:2",
    bitrate: "~102 Mbps @1080p"
  },
  ProRes422Proxy: {
    codec: "ProRes 422 Proxy",
    audio: "AAC 320kbps",
    colorDepth: "8-bit",
    chroma: "4:2:0",
    bitrate: "~36 Mbps @1080p"
  },
  DnxHRHQX: {
    codec: "DNxHR HQX",
    audio: "PCM 16-bit",
    colorDepth: "10-bit",
    chroma: "4:2:2",
    bitrate: "~295 Mbps @1080p"
  },
  H264Crf18: {
    codec: "H.264 CRF 18",
    audio: "AAC 320kbps",
    colorDepth: "8-bit",
    chroma: "4:2:0",
    bitrate: "~25 Mbps @1080p"
  },
};

// Preset information for UI display
export const PRESET_INFO: Record<OutputPreset, {
  name: string;
  description: string;
  bitrateMbps: number;
}> = {
  ProRes422: {
    name: PRESET_DISPLAY_NAMES.ProRes422,
    description: "ProRes, 10-bit, 4:2:2, PCM",
    bitrateMbps: PRESET_BITRATE.ProRes422, // 147 Mbps at 1080p
  },
  ProRes422LT: {
    name: PRESET_DISPLAY_NAMES.ProRes422LT,
    description: "ProRes, 10-bit, 4:2:2, PCM",
    bitrateMbps: PRESET_BITRATE.ProRes422LT, // 102 Mbps at 1080p
  },
  ProRes422Proxy: {
    name: PRESET_DISPLAY_NAMES.ProRes422Proxy,
    description: "ProRes, 8-bit, 4:2:0, AAC 320kbps",
    bitrateMbps: PRESET_BITRATE.ProRes422Proxy, // 36 Mbps at 1080p
  },
  DnxHRHQX: {
    name: PRESET_DISPLAY_NAMES.DnxHRHQX,
    description: "DNxHR, 10-bit, 4:2:2, PCM",
    bitrateMbps: PRESET_BITRATE.DnxHRHQX, // 295 Mbps at 1080p
  },
  H264Crf18: {
    name: PRESET_DISPLAY_NAMES.H264Crf18,
    description: "H.264, 8-bit, 4:2:0, AAC 320kbps",
    bitrateMbps: PRESET_BITRATE.H264Crf18, // 25 Mbps at 1080p (variable bitrate, CRF-based)
  },
};

// Re-export preset-related types and constants for convenience
export { PRESET_DISPLAY_NAMES, PRESET_BITRATE } from "./types";
export type { OutputPreset } from "./types";
