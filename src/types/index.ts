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

// Dropdown item interface
export interface DropdownItem {
  label?: string;
  onClick?: () => void;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}
