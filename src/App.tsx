import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
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

// Preset definitions for UI
const PRESET_INFO = {
  ProRes422: {
    name: "ProRes 422",
    description: "Recommended - Main editing format, 10-bit, 4:2:2",
    bitrateMbps: 147, // at 1080p
  },
  ProRes422LT: {
    name: "ProRes 422 LT",
    description: "Light version for disk-space constrained scenarios",
    bitrateMbps: 102, // at 1080p
  },
  DnxHRHQX: {
    name: "DNxHR HQX",
    description: "Windows-friendly alternative, 10-bit, 4:2:2",
    bitrateMbps: 295, // at 1080p
  },
} as const;

// Calculate estimated output file size
function estimateOutputSize(
  metadata: MediaMetadata | null,
  preset: OutputPreset
): string {
  if (!metadata) return "Select a video file";

  const presetInfo = PRESET_INFO[preset];
  const baseBitrate = presetInfo.bitrateMbps * 1_000_000; // Convert to bits/sec

  // Scale bitrate based on resolution (1080p as baseline)
  const pixels = metadata.video.width * metadata.video.height;
  const baselinePixels = 1920 * 1080;
  const resolutionFactor = pixels / baselinePixels;

  const adjustedBitrate = baseBitrate * resolutionFactor;
  const totalBits = adjustedBitrate * metadata.duration_sec;
  const totalBytes = totalBits / 8; // Convert to bytes

  // Format as human-readable
  const gb = totalBytes / (1024 ** 3);
  if (gb >= 1) {
    return `~${gb.toFixed(1)} GB`;
  }
  const mb = totalBytes / (1024 ** 2);
  return `~${mb.toFixed(0)} MB`;
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

  // Legacy single-file progress
  const [progress, setProgress] = useState<TranscodeProgress | null>(null);

  const { ffmpegAvailable, checking } = useFfmpegCheck();

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

    // Add new files (avoid duplicates)
    const newPaths = paths.filter((p) => !selectedFiles.includes(p));
    const allPaths = [...selectedFiles, ...newPaths];
    setSelectedFiles(allPaths);

    // Fetch metadata for each new file
    const newMetadata: (MediaMetadata | null)[] = [];
    for (const path of newPaths) {
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

    // Update metadata list, preserving existing metadata
    setMetadataList((prev) => {
      const result = [...prev];
      for (let i = 0; i < newPaths.length; i++) {
        const pathIndex = allPaths.indexOf(newPaths[i]);
        result[pathIndex] = newMetadata[i];
      }
      // Fill gaps for files that were removed
      while (result.length < allPaths.length) {
        result.push(null);
      }
      return result.slice(0, allPaths.length);
    });

    // Set output directory to first file's directory if not set
    if (newPaths.length > 0 && !outputDir) {
      const firstPath = newPaths[0];
      const dirMatch = firstPath.match(/^(.*[/\\])/);
      if (dirMatch) {
        setOutputDir(dirMatch[1]);
      }
    }

    // Create tasks for new files
    setTasks((prev) => {
      const newTasks = [...prev];
      for (const path of newPaths) {
        const fileName = path.split(/[/\\]/).pop() || path;
        const suffix =
          selectedPreset === "ProRes422LT"
            ? "_proreslt"
            : selectedPreset === "DnxHRHQX"
              ? "_dnxhr"
              : "_prores";
        const outputPath = `${outputDir || ""}${fileName}${suffix}.mov`;

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

  // Update output paths when preset changes
  useEffect(() => {
    if (tasks.length > 0) {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          const fileName = task.inputPath.split(/[/\\]/).pop() || task.inputPath;
          const suffix =
            selectedPreset === "ProRes422LT"
              ? "_proreslt"
              : selectedPreset === "DnxHRHQX"
                ? "_dnxhr"
                : "_prores";
          return {
            ...task,
            outputPath: `${outputDir}${fileName}${suffix}.mov`,
          };
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset, outputDir]);

  // Update output paths when output directory changes
  useEffect(() => {
    if (tasks.length > 0) {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          const fileName = task.inputPath.split(/[/\\]/).pop() || task.inputPath;
          const suffix =
            selectedPreset === "ProRes422LT"
              ? "_proreslt"
              : selectedPreset === "DnxHRHQX"
                ? "_dnxhr"
                : "_prores";
          return {
            ...task,
            outputPath: `${outputDir}${fileName}${suffix}.mov`,
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
                ? metadataList
                    .map((meta) =>
                      meta ? estimateOutputSize(meta, selectedPreset) : "Unknown"
                    )
                    .reduce((acc, size) => {
                      // Simple sum of MB/GB values
                      const parseSize = (s: string): number => {
                        if (s.endsWith("GB")) {
                          return parseFloat(s.replace("~", "").replace(" GB", "")) * 1024;
                        }
                        if (s.endsWith("MB")) {
                          return parseFloat(s.replace("~", "").replace(" MB", ""));
                        }
                        return 0;
                      };
                      return acc + parseSize(size);
                    }, 0) > 1024
                  ? `~${(metadataList
                      .map((meta) =>
                        meta ? estimateOutputSize(meta, selectedPreset) : "Unknown"
                      )
                      .reduce((acc: number, size: string) => {
                        const parseSize = (s: string): number => {
                          if (s.endsWith("GB")) {
                            return parseFloat(s.replace("~", "").replace(" GB", "")) * 1024;
                          }
                          if (s.endsWith("MB")) {
                            return parseFloat(s.replace("~", "").replace(" MB", ""));
                          }
                          return 0;
                        };
                        return acc + parseSize(size);
                      }, 0) / 1024
                    ).toFixed(1)} GB`
                  : `~${metadataList
                      .map((meta) =>
                        meta ? estimateOutputSize(meta, selectedPreset) : "Unknown"
                      )
                      .reduce((acc: number, size: string) => {
                        const parseSize = (s: string): number => {
                          if (s.endsWith("GB")) {
                            return parseFloat(s.replace("~", "").replace(" GB", "")) * 1024;
                          }
                          if (s.endsWith("MB")) {
                            return parseFloat(s.replace("~", "").replace(" MB", ""));
                          }
                          return 0;
                        };
                        return acc + parseSize(size);
                      }, 0)
                    .toFixed(0)} MB`
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
