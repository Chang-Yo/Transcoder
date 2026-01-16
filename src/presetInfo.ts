export const PRESET_INFO = {
  ProRes422: {
    name: "ProRes 422",
    description: "ProRes, 10-bit, 4:2:2, PCM",
    bitrateMbps: 147, // at 1080p
  },
  ProRes422LT: {
    name: "ProRes 422 LT",
    description: "ProRes, 10-bit, 4:2:2, PCM",
    bitrateMbps: 102, // at 1080p
  },
  ProRes422Proxy: {
    name: "ProRes 422 Proxy",
    description: "ProRes, 8-bit, 4:2:0, AAC 320kbps",
    bitrateMbps: 36, // at 1080p
  },
  DnxHRHQX: {
    name: "DNxHR HQX",
    description: "DNxHR, 10-bit, 4:2:2, PCM",
    bitrateMbps: 295, // at 1080p
  },
  H264Crf18: {
    name: "H.264 CRF 18",
    description: "H.264, 8-bit, 4:2:0, AAC 320kbps",
    bitrateMbps: 25, // at 1080p (variable bitrate, CRF-based)
  },
} as const;

// Re-export preset display names from types for convenience
export { PRESET_DISPLAY_NAMES } from "./types";
export type { OutputPreset } from "./types";
