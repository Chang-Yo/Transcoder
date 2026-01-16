import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { readDir } from "@tauri-apps/api/fs";
import "./App.css";
import { useFfmpegCheck } from "./hooks/useFfmpegCheck";
import { FileSelector } from "./components/FileSelector";
import { BatchQueue } from "./components/BatchQueue";
import { ProgressDisplay } from "./components/ProgressDisplay";
import { ErrorMessage } from "./components/ErrorMessage";
import type {
  TranscodeProgress,
  OutputPreset,
  MediaMetadata,
  FileTask,
  BatchProgress,
} from "./types";

// Supported video file extensions
const VIDEO_EXTENSIONS = [
  "mp4", "mkv", "avi", "mov", "m4v", "webm", "flv", "wmv"
];

// Check if a path is a video file based on extension
function isVideoFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext ? VIDEO_EXTENSIONS.includes(ext) : false;
}

// Read video files from a folder (non-recursive)
async function readVideoFilesFromFolder(folderPath: string): Promise<string[]> {
  try {
    const entries = await readDir(folderPath);
    const videoFiles = entries
      .filter(entry => !entry.children && entry.path && isVideoFile(entry.path))
      .map(entry => entry.path);
    return videoFiles;
  } catch (error) {
    console.error("Failed to read folder:", error);
    return [];
  }
}

// Preset definitions for UI
const PRESET_INFO = {
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

// Get output file suffix and extension for a preset
function getPresetOutputInfo(preset: OutputPreset): { suffix: string; ext: ".mov" | ".mp4" } {
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

// Calculate estimated output file size (returns size in MB, or range for CRF)
function estimateOutputSize(
  metadata: MediaMetadata | null,
  preset: OutputPreset
): { minMB: number; maxMB: number } {
  if (!metadata) return { minMB: 0, maxMB: 0 };

  // H.264 CRF is quality-based, not bitrate-based
  // Output size varies greatly based on content complexity
  if (preset === "H264Crf18") {
    const pixels = metadata.video.width * metadata.video.height;
    const baselinePixels = 1920 * 1080;
    const resolutionFactor = pixels / baselinePixels;

    // Base size estimates at 1080p (in MB per minute)
    const minSizePerMin = 15 * resolutionFactor; // ~15 MB/min for simple content
    const maxSizePerMin = 45 * resolutionFactor; // ~45 MB/min for complex content

    const durationMin = metadata.duration_sec / 60;
    return {
      minMB: minSizePerMin * durationMin,
      maxMB: maxSizePerMin * durationMin,
    };
  }

  // For CBR presets (ProRes, DNxHR), use fixed bitrate calculation
  const presetInfo = PRESET_INFO[preset];
  const baseBitrate = presetInfo.bitrateMbps * 1_000_000; // Convert to bits/sec

  // Scale bitrate based on resolution (1080p as baseline)
  const pixels = metadata.video.width * metadata.video.height;
  const baselinePixels = 1920 * 1080;
  const resolutionFactor = pixels / baselinePixels;

  const adjustedBitrate = baseBitrate * resolutionFactor;
  const totalBits = adjustedBitrate * metadata.duration_sec;
  const totalMB = totalBits / 8 / (1024 ** 2);

  // For CBR, min and max are the same
  return { minMB: totalMB, maxMB: totalMB };
}

// Format size for display
function formatSize(sizeMB: number): string {
  if (sizeMB >= 1024) {
    return `~${(sizeMB / 1024).toFixed(1)} GB`;
  }
  return `~${sizeMB.toFixed(0)} MB`;
}

// Format size range for display (for CRF presets)
function formatSizeRange(minMB: number, maxMB: number): string {
  if (minMB === maxMB) {
    return formatSize(minMB);
  }
  const maxGB = maxMB / 1024;
  if (maxGB >= 1) {
    return `~${(minMB / 1024).toFixed(1)}-${maxGB.toFixed(1)} GB`;
  }
  return `~${minMB.toFixed(0)}-${maxMB.toFixed(0)} MB`;
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [metadataList, setMetadataList] = useState<(MediaMetadata | null)[]>([]);
  const [outputDir, setOutputDir] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<OutputPreset>("ProRes422");
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Batch task tracking
  const [tasks, setTasks] = useState<FileTask[]>([]);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  // Debounce tracking for file drop to prevent race conditions
  const [lastDropTime, setLastDropTime] = useState<number>(0);

  // Legacy single-file progress
  const [progress, setProgress] = useState<TranscodeProgress | null>(null);

  const { ffmpegAvailable, checking, ffmpegSource } = useFfmpegCheck();

  // Show notification if using bundled FFmpeg
  useEffect(() => {
    if (ffmpegSource === "filesystem") {
      // Show a one-time notification that we're using bundled FFmpeg
      console.log("Using bundled FFmpeg from ffmpeg/ folder");
    }
  }, [ffmpegSource]);

  // Listen for batch progress updates
  useEffect(() => {
    const unlisten = listen<BatchProgress>("batch-transcode-progress", (event) => {
      const { batch_id, file_index, progress: progressData } = event.payload;

      // Only process if it's for the current batch
      if (currentBatchId && batch_id === currentBatchId) {
        setTasks((prevTasks) => {
          const newTasks = [...prevTasks];
          if (file_index < newTasks.length) {
            newTasks[file_index] = {
              ...newTasks[file_index],
              status: "transcoding",
              progress: progressData,
            };
          }
          return newTasks;
        });
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [currentBatchId]);

  // Listen for batch completion
  useEffect(() => {
    const unlistenComplete = listen("batch-transcode-complete", (event) => {
      const [batch_id, file_index] = event.payload as [string, number];

      if (currentBatchId && batch_id === currentBatchId) {
        setTasks((prevTasks) => {
          const newTasks = [...prevTasks];
          if (file_index < newTasks.length) {
            newTasks[file_index] = {
              ...newTasks[file_index],
              status: "completed",
              progress: {
                ...newTasks[file_index].progress!,
                progress_percent: 100,
              },
            };
          }
          return newTasks;
        });

        // Check if all tasks are completed
        setTasks((prevTasks) => {
          const allCompleted = prevTasks.every(
            (t) => t.status === "completed" || t.status === "failed"
          );
          if (allCompleted) {
            setIsTranscoding(false);
            setCurrentBatchId(null);
          }
          return prevTasks;
        });
      }
    });

    const unlistenError = listen("batch-transcode-error", (event) => {
      const [batch_id, file_index] = event.payload as [string, number];

      if (currentBatchId && batch_id === currentBatchId) {
        setTasks((prevTasks) => {
          const newTasks = [...prevTasks];
          if (file_index < newTasks.length) {
            newTasks[file_index] = {
              ...newTasks[file_index],
              status: "failed",
            };
          }
          return newTasks;
        });
      }
    });

    return () => {
      unlistenComplete.then((fn) => fn());
      unlistenError.then((fn) => fn());
    };
  }, [currentBatchId]);

  // Legacy listeners for single-file mode
  useEffect(() => {
    const unlistenProgress = listen<TranscodeProgress>("transcode-progress", (event) => {
      setProgress(event.payload);
    });

    const unlistenComplete = listen("transcode-complete", () => {
      setIsTranscoding(false);
      setProgress((prev) => (prev ? { ...prev, progress_percent: 100 } : null));
    });

    const unlistenError = listen("transcode-error", () => {
      setIsTranscoding(false);
      setError("Transcoding failed. Check that ffmpeg is installed and the input file is valid.");
    });

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenComplete.then((fn) => fn());
      unlistenError.then((fn) => fn());
    };
  }, []);

  const handleFilesSelect = async (paths: string[]) => {
    setError(null);
    setProgress(null);

    // Fetch metadata for each new file
    const newMetadata: (MediaMetadata | null)[] = [];
    for (const path of paths) {
      try {
        const meta = await invoke<MediaMetadata>("get_media_info", {
          filePath: path,
        });
        newMetadata.push(meta);
      } catch (err) {
        console.error("Failed to fetch metadata:", err);
        newMetadata.push(null);
      }
    }

    // Use functional state update to avoid closure trap and ensure we get latest state
    setSelectedFiles((prev) => {
      const newPaths = paths.filter((p) => !prev.includes(p));
      return [...prev, ...newPaths];
    });

    // Update metadata list with functional update
    setMetadataList((prev) => [...prev, ...newMetadata]);

    // Set output directory to first file's directory if not set
    if (paths.length > 0) {
      setOutputDir((prev) => {
        if (!prev) {
          const firstPath = paths[0];
          const dirMatch = firstPath.match(/^(.*[/\\])/);
          return dirMatch ? dirMatch[1] : "";
        }
        return prev;
      });
    }

    // Update tasks with functional update
    setTasks((prev) => {
      const newTasks = [...prev];
      const { suffix, ext } = getPresetOutputInfo(selectedPreset);

      for (const path of paths) {
        // Skip if this file already exists in tasks
        if (newTasks.some((task) => task.inputPath === path)) {
          continue;
        }
        const fileName = path.split(/[/\\]/).pop() || path;
        const outputPath = `${outputDir || ""}${fileName}${suffix}${ext}`;

        newTasks.push({
          inputPath: path,
          outputPath,
          fileName,
          status: "pending",
          progress: null,
        });
      }
      return newTasks;
    });
  };

  // Listen for Tauri file drop events
  useEffect(() => {
    const unlisten = listen<string[]>("tauri://file-drop", async (event) => {
      if (isTranscoding) return;

      // Debounce: only process one drop per 500ms to prevent race conditions
      const now = Date.now();
      if (now - lastDropTime < 500) {
        return;
      }
      setLastDropTime(now);

      const droppedPaths = event.payload;
      const allVideoFiles: string[] = [];

      // Process each dropped path
      for (const path of droppedPaths) {
        if (isVideoFile(path)) {
          // It's a video file, add it directly
          allVideoFiles.push(path);
        } else {
          // It might be a folder, try to read video files from it
          const videoFiles = await readVideoFilesFromFolder(path);
          allVideoFiles.push(...videoFiles);
        }
      }

      // If we found any video files, select them
      if (allVideoFiles.length > 0) {
        await handleFilesSelect(allVideoFiles);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [isTranscoding, lastDropTime]);

  // Update output paths when preset changes
  useEffect(() => {
    if (tasks.length > 0) {
      const { suffix, ext } = getPresetOutputInfo(selectedPreset);
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          const fileName = task.inputPath.split(/[/\\]/).pop() || task.inputPath;
          return {
            ...task,
            outputPath: `${outputDir}${fileName}${suffix}${ext}`,
          };
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset, outputDir]);

  // Update output paths when output directory changes
  useEffect(() => {
    if (tasks.length > 0) {
      const { suffix, ext } = getPresetOutputInfo(selectedPreset);
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          const fileName = task.inputPath.split(/[/\\]/).pop() || task.inputPath;
          return {
            ...task,
            outputPath: `${outputDir}${fileName}${suffix}${ext}`,
          };
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputDir]);

  const handleRemoveTask = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setMetadataList((prev) => prev.filter((_, i) => i !== index));
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartBatchTranscode = async () => {
    if (selectedFiles.length === 0 || !outputDir) return;

    setError(null);
    setIsTranscoding(true);
    setProgress(null);

    // Reset all tasks to pending
    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        status: "pending" as const,
        progress: null,
      }))
    );

    try {
      const batchId = await invoke("start_batch_transcode", {
        request: {
          input_paths: selectedFiles,
          output_dir: outputDir,
          preset: selectedPreset,
        },
      });
      setCurrentBatchId(batchId as string);
    } catch (err) {
      setIsTranscoding(false);
      setError(err as string);
    }
  };

  if (checking) {
    return (
      <main className="container">
        <div className="checking">
          <p>Checking ffmpeg availability...</p>
        </div>
      </main>
    );
  }

  if (!ffmpegAvailable) {
    return (
      <main className="container">
        <div className="error-container">
          <h2>FFmpeg Not Found</h2>
          <p>
            This app requires ffmpeg and ffprobe to be installed on your system.
            Please install ffmpeg and ensure it&apos;s in your system PATH.
          </p>
          <p>
            <a
              href="https://ffmpeg.org/download.html"
              target="_blank"
              rel="noreferrer"
            >
              Download FFmpeg
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Editing Transcoder</h1>
      <p className="subtitle">Convert videos to editing-friendly formats</p>

      {ffmpegSource === "filesystem" && (
        <div className="info-banner">
          <span className="info-icon"></span>
          <span>Using bundled FFmpeg (system FFmpeg not found)</span>
        </div>
      )}

      <FileSelector
        onFilesSelect={handleFilesSelect}
        selectedFiles={selectedFiles}
        disabled={isTranscoding}
      />

      {selectedFiles.length > 0 && (
        <div className="options">
          {/* Preset Selection */}
          <div className="preset-selector">
            <label className="preset-label">Output Format:</label>
            <div className="preset-options">
              {(Object.keys(PRESET_INFO) as OutputPreset[]).map((preset) => (
                <label
                  key={preset}
                  className={`preset-card ${
                    selectedPreset === preset ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="preset"
                    value={preset}
                    checked={selectedPreset === preset}
                    onChange={() => setSelectedPreset(preset)}
                    disabled={isTranscoding}
                  />
                  <div className="preset-card-content">
                    <div className="preset-name">{PRESET_INFO[preset].name}</div>
                    <div className="preset-description">
                      {PRESET_INFO[preset].description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Output Directory */}
          <div className="output-path">
            <label htmlFor="output-dir">Output Directory:</label>
            <input
              id="output-dir"
              type="text"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              disabled={isTranscoding}
            />
          </div>

          {/* Total Estimated Output Size */}
          <div className="size-estimate">
            <span className="size-label">Total estimated size:</span>{" "}
            <span className="size-value">
              {metadataList.length > 0
                ? (() => {
                    // Sum up all file sizes (using average of min/max for CRF)
                    const totalMinMB = metadataList.reduce((acc, meta) => {
                      if (!meta) return acc;
                      const size = estimateOutputSize(meta, selectedPreset);
                      return acc + size.minMB;
                    }, 0);
                    const totalMaxMB = metadataList.reduce((acc, meta) => {
                      if (!meta) return acc;
                      const size = estimateOutputSize(meta, selectedPreset);
                      return acc + size.maxMB;
                    }, 0);
                    return formatSizeRange(totalMinMB, totalMaxMB);
                  })()
                : "Select video files"}
            </span>
          </div>

          {/* Start Button */}
          <button
            className="start-button"
            onClick={handleStartBatchTranscode}
            disabled={isTranscoding || !outputDir || selectedFiles.length === 0}
          >
            {isTranscoding ? "Transcoding..." : `Start Batch Transcode (${selectedFiles.length} files)`}
          </button>
        </div>
      )}

      {/* Batch Queue Display */}
      <BatchQueue tasks={tasks} onRemoveTask={handleRemoveTask} />

      {/* Legacy Progress Display for single-file mode compatibility */}
      {progress && tasks.length === 0 && <ProgressDisplay progress={progress} />}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
    </main>
  );
}

export default App;
