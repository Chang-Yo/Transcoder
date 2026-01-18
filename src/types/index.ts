export interface MediaMetadata {
  file_path: string;
  duration_sec: number;
  video: {
    codec: string;
    width: number;
    height: number;
    framerate: string;
    bit_depth: number;
    pix_fmt: string;
    chroma_subsampling: string;
  };
  audio?: {
    codec: string;
    sample_rate: number;
    channels: number;
  };
}

export interface TimeSegment {
  start_sec: number;  // Start time in seconds
  end_sec: number | null;  // End time in seconds, null means end of video
}

export type OutputPreset = "ProRes422" | "ProRes422LT" | "ProRes422Proxy" | "DnxHRHQX" | "H264Crf18";

// Preset bitrate information for size estimation
export const PRESET_BITRATE: Record<OutputPreset, number> = {
  ProRes422: 147,      // Mbps at 1080p
  ProRes422LT: 102,
  ProRes422Proxy: 36,
  DnxHRHQX: 295,
  H264Crf18: 25,       // Variable bitrate, CRF-based
};

/** Get output file suffix and extension for a preset */
export function getPresetOutputInfo(preset: OutputPreset): { suffix: string; ext: ".mov" | ".mp4" } {
  switch (preset) {
    case "ProRes422LT":
      return { suffix: "_proreslt", ext: ".mov" };
    case "DnxHRHQX":
      return { suffix: "_dnxhr", ext: ".mov" };
    case "ProRes422Proxy":
      return { suffix: "_proxy", ext: ".mov" };
    case "H264Crf18":
      return { suffix: "_h264", ext: ".mp4" };
    default:
      return { suffix: "_prores", ext: ".mov" };
  }
}

export interface TranscodeRequest {
  input_path: string;
  output_path: string;
  preset: OutputPreset;
  segment?: TimeSegment;  // Optional
}

export interface TranscodeProgress {
  current_file: string;
  progress_percent: number;
  fps?: number;
  bitrate?: string;
  time_elapsed: string;
  estimated_time?: string;
}

export interface FfmpegAvailability {
  ffmpeg: boolean;
  ffprobe: boolean;
  ffmpegSource?: "system" | "filesystem";
}

// Batch transcoding types
export interface BatchTranscodeRequest {
  input_paths: string[];
  output_paths: string[];  // Full output paths for each input file
  preset: OutputPreset;
  segments?: (TimeSegment | null)[];  // Optional segments for each file
}

export interface BatchProgress {
  batch_id: string;
  file_index: number;
  total_files: number;
  progress: TranscodeProgress;
}

export type FileTaskStatus = "pending" | "transcoding" | "completed" | "failed";

// Status display labels for FileTask status
export const FILE_TASK_STATUS_LABELS: Record<FileTaskStatus, string> = {
  pending: "Pending",
  transcoding: "Processing",
  completed: "Done",
  failed: "Failed",
};

export interface FileTask {
  id: string;              // Unique identifier (inputPath serves as ID)
  inputPath: string;       // Full input file path
  outputFileName: string;  // User-editable base file name (without suffix/extension)
  suffix: string;          // Preset-determined suffix (e.g., "_prores")
  extension: string;       // File extension (e.g., ".mov")
  status: FileTaskStatus;
  progress: TranscodeProgress | null;
  originalFileName: string; // Original input file name for display
  segment: TimeSegment | null;  // null means full video
  preset?: OutputPreset;  // undefined = use global preset, set = custom preset for this file
}

// Helper to get the full output path from a FileTask
export function getOutputPath(task: FileTask, outputDir: string): string {
  return `${outputDir}${task.outputFileName}${task.suffix}${task.extension}`;
}

// Time formatting helpers for segments

/** Convert seconds to HH:MM:SS format */
export function secondsToTimecode(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/** Parse HH:MM:SS timecode to seconds */
export function timecodeToSeconds(timecode: string): number | null {
  const parts = timecode.split(':');
  if (parts.length !== 3) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
  if (minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) return null;

  return hours * 3600 + minutes * 60 + seconds;
}

/** Format segment as filename suffix (e.g., "_0105-0230") */
export function formatSegmentSuffix(segment: TimeSegment | null): string {
  if (!segment) return "";

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`;
  };

  const start = formatTime(segment.start_sec);
  const end = segment.end_sec !== null
    ? formatTime(segment.end_sec)
    : "end";
  return `_${start}-${end}`;
}

/** Calculate segment duration in seconds */
export function getSegmentDuration(segment: TimeSegment | null, totalDuration: number): number {
  if (!segment) return totalDuration;
  const end = segment.end_sec ?? totalDuration;
  return Math.max(0, Math.min(end, totalDuration) - segment.start_sec);
}

// Preset display names
export const PRESET_DISPLAY_NAMES: Record<OutputPreset, string> = {
  ProRes422: "ProRes 422",
  ProRes422LT: "ProRes 422 LT",
  ProRes422Proxy: "ProRes 422 Proxy",
  DnxHRHQX: "DNxHR HQX",
  H264Crf18: "H.264 CRF 18",
};

// App Settings interface
export interface AppSettings {
  defaultPreset: OutputPreset;
  defaultOutputDir: string;
  rememberOutputDir: boolean;
  defaultSegmentLength: number;
}

// Size estimation helpers

// Constants for size estimation calculations
export const BASELINE_WIDTH = 1920;
export const BASELINE_HEIGHT = 1080;
export const BASELINE_PIXELS = BASELINE_WIDTH * BASELINE_HEIGHT;
export const BITS_PER_BYTE = 8;
export const BYTES_PER_MB = 1024 ** 2;

// H.264 size estimation constants (MB per minute at 1080p)
export const H264_MIN_SIZE_MB_PER_MIN = 15;
export const H264_MAX_SIZE_MB_PER_MIN = 45;

/** Calculate estimated output file size */
export function estimateOutputSize(
  metadata: MediaMetadata,
  preset: OutputPreset
): { minMB: number; maxMB: number } {
  if (preset === "H264Crf18") {
    const pixels = metadata.video.width * metadata.video.height;
    const resolutionFactor = pixels / BASELINE_PIXELS;
    const minSizePerMin = H264_MIN_SIZE_MB_PER_MIN * resolutionFactor;
    const maxSizePerMin = H264_MAX_SIZE_MB_PER_MIN * resolutionFactor;
    const durationMin = metadata.duration_sec / 60;
    return {
      minMB: minSizePerMin * durationMin,
      maxMB: maxSizePerMin * durationMin,
    };
  }

  const baseBitrate = PRESET_BITRATE[preset] * 1_000_000;
  const pixels = metadata.video.width * metadata.video.height;
  const resolutionFactor = pixels / BASELINE_PIXELS;
  const adjustedBitrate = baseBitrate * resolutionFactor;
  const totalBits = adjustedBitrate * metadata.duration_sec;
  const totalMB = totalBits / BITS_PER_BYTE / BYTES_PER_MB;

  return { minMB: totalMB, maxMB: totalMB };
}

/** Calculate estimated output size range for a task */
export function getEstimatedSizeRange(
  task: FileTask,
  metadata: MediaMetadata | null,
  preset: OutputPreset
): { minMB: number; maxMB: number } | null {
  if (!metadata) return null;
  const segmentDuration = getSegmentDuration(task.segment, metadata.duration_sec);
  const adjustedMeta = { ...metadata, duration_sec: segmentDuration };
  return estimateOutputSize(adjustedMeta, preset);
}

/** Format size for display */
export function formatSize(sizeMB: number): string {
  if (sizeMB >= 1024) {
    return `~${(sizeMB / 1024).toFixed(1)} GB`;
  }
  return `~${sizeMB.toFixed(0)} MB`;
}

/** Format size range for display */
export function formatSizeRange(minMB: number, maxMB: number): string {
  if (minMB === maxMB) {
    return formatSize(minMB);
  }
  const maxGB = maxMB / 1024;
  if (maxGB >= 1) {
    return `~${(minMB / 1024).toFixed(1)}-${maxGB.toFixed(1)} GB`;
  }
  return `~${minMB.toFixed(0)}-${maxMB.toFixed(0)} MB`;
}
