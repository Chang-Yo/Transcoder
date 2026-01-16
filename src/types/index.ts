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

export type OutputPreset = "ProRes422" | "ProRes422LT" | "ProRes422Proxy" | "DnxHRHQX" | "H264Crf18";

export interface TranscodeRequest {
  input_path: string;
  output_path: string;
  preset: OutputPreset;
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
}

// Helper to get the full output path from a FileTask
export function getOutputPath(task: FileTask, outputDir: string): string {
  return `${outputDir}${task.outputFileName}${task.suffix}${task.extension}`;
}
