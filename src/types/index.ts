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

export type OutputPreset = "ProRes422" | "ProRes422LT" | "ProRes422Proxy" | "DnxHRHQX";

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
}

// Batch transcoding types
export interface BatchTranscodeRequest {
  input_paths: string[];
  output_dir: string;
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
  inputPath: string;
  outputPath: string;
  fileName: string;
  status: FileTaskStatus;
  progress: TranscodeProgress | null;
}
