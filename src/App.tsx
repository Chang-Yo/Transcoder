import { useState, useEffect, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { readDir } from "@tauri-apps/api/fs";
import { open } from "@tauri-apps/api/dialog";
import "./App.layout.css";
import "./index.css";
import { useFfmpegCheck } from "./hooks/useFfmpegCheck";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useModal } from "./hooks/useModal";
import { SidebarPanel } from "./components/SidebarPanel";
import { FileQueue } from "./components/FileQueue";
import { FileDropZone } from "./components/FileDropZone";
import { StatusBar } from "./components/StatusBar";
import { SettingsDialog } from "./components/SettingsDialog";
import { ErrorMessage } from "./components/ErrorMessage";
import type {
  OutputPreset,
  MediaMetadata,
  FileTask,
  BatchProgress,
  AppSettings,
} from "./types";
import {
  getOutputPath,
  getPresetOutputInfo,
  formatSizeRange,
  getEstimatedSizeRange,
} from "./types";
import { ERROR_MESSAGES } from "./constants/messages";
import { TAURI_EVENTS } from "./constants/events";
import { logger } from "./utils/logger";
import { pluralize } from "./utils/text";

// Constants
const FILE_DROP_DEBOUNCE_MS = 500;

// Supported video file extensions
const VIDEO_EXTENSIONS = [
  "mp4", "mkv", "avi", "mov", "m4v", "webm", "flv", "wmv"
];

// Check if a path is a video file based on extension
function isVideoFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext ? VIDEO_EXTENSIONS.includes(ext) : false;
}

// Extract file name from path
function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

// Extract base file name without extension
function getBaseFileName(path: string): string {
  const fileName = getFileName(path);
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
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
    logger.error("Failed to read folder:", error);
    return [];
  }
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  defaultPreset: "ProRes422",
  defaultOutputDir: "",
  rememberOutputDir: false,
  defaultSegmentLength: 30,
};

// Helper to get effective preset for a task (local or global)
function getEffectivePreset(task: FileTask, globalPreset: OutputPreset): OutputPreset {
  return task.preset ?? globalPreset;
}

function App() {
  // UI State
  const settingsModal = useModal();
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // File and task state
  const [_selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [metadataList, setMetadataList] = useState<(MediaMetadata | null)[]>([]);
  const [outputDir, setOutputDir] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<OutputPreset>(DEFAULT_SETTINGS.defaultPreset);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Batch task tracking
  const [tasks, setTasks] = useState<FileTask[]>([]);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [taskDurations, setTaskDurations] = useState<Map<string, number>>(new Map());

  // Expanded card state
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  // Debounce tracking for file drop
  const [lastDropTime, setLastDropTime] = useState<number>(0);

  const { ffmpegAvailable, checking, ffmpegSource } = useFfmpegCheck();

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as AppSettings;
        setAppSettings(parsed);
        setSelectedPreset(parsed.defaultPreset);
        if (parsed.rememberOutputDir && parsed.defaultOutputDir) {
          setOutputDir(parsed.defaultOutputDir);
        }
      } catch (e) {
        logger.error("Failed to parse saved settings:", e);
      }
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(appSettings));
  }, [appSettings]);

  // Show notification if using bundled FFmpeg
  useEffect(() => {
    if (ffmpegSource === "filesystem") {
      logger.info("Using bundled FFmpeg from ffmpeg/ folder");
    }
  }, [ffmpegSource]);

  // Listen for batch progress updates
  useEffect(() => {
    const unlisten = listen<BatchProgress>(TAURI_EVENTS.BATCH_PROGRESS, (event) => {
      const { batch_id, file_index, progress: progressData } = event.payload;

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
    const unlistenComplete = listen(TAURI_EVENTS.BATCH_COMPLETE, (event) => {
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

    const unlistenError = listen(TAURI_EVENTS.BATCH_ERROR, (event) => {
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

  // Handle global preset change - only update tasks without custom presets
  const handleGlobalPresetChange = useCallback((newPreset: OutputPreset) => {
    setSelectedPreset(newPreset);
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        // Only update tasks that don't have a custom preset
        if (task.preset === undefined) {
          const { suffix, ext } = getPresetOutputInfo(newPreset);
          return { ...task, suffix, extension: ext };
        }
        return task;
      })
    );
  }, []);

  // Handle toggle expand for card
  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedCardIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  // Handle task update from FileCard
  const handleUpdateTask = useCallback((taskId: string, updates: Partial<FileTask>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  }, []);

  // Handle apply to all from FileCard
  const handleApplyToAll = useCallback((updates: Partial<FileTask>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        // Apply the updates to all tasks
        // For preset, only apply to tasks without custom presets if preset is not specified
        if (updates.preset !== undefined) {
          // This is a preset change - only apply to tasks without custom presets
          if (task.preset === undefined) {
            const { suffix, ext } = getPresetOutputInfo(updates.preset);
            return { ...task, preset: updates.preset, suffix, extension: ext };
          }
          return task;
        }
        // For other updates (filename, segment), apply to all
        return { ...task, ...updates };
      })
    );
  }, []);

  // Listen for Tauri file drop events
  useEffect(() => {
    const unlisten = listen<string[]>("tauri://file-drop", async (event) => {
      if (isTranscoding) return;

      const now = Date.now();
      if (now - lastDropTime < FILE_DROP_DEBOUNCE_MS) {
        return;
      }
      setLastDropTime(now);

      const droppedPaths = event.payload;
      const allVideoFiles: string[] = [];

      for (const path of droppedPaths) {
        if (isVideoFile(path)) {
          allVideoFiles.push(path);
        } else {
          const videoFiles = await readVideoFilesFromFolder(path);
          allVideoFiles.push(...videoFiles);
        }
      }

      if (allVideoFiles.length > 0) {
        await handleFilesSelect(allVideoFiles);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [isTranscoding, lastDropTime]);

  // Calculate estimated total size (using effective presets for each task)
  const estimatedTotalSize = useMemo(() => {
    if (tasks.length === 0) return "Select video files";

    let totalMinMB = 0;
    let totalMaxMB = 0;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const meta = metadataList[i];
      const effectivePreset = getEffectivePreset(task, selectedPreset);
      const sizeRange = getEstimatedSizeRange(task, meta, effectivePreset);
      if (!sizeRange) continue;
      totalMinMB += sizeRange.minMB;
      totalMaxMB += sizeRange.maxMB;
    }

    return formatSizeRange(totalMinMB, totalMaxMB);
  }, [tasks, metadataList, selectedPreset]);

  // Calculate estimated time remaining
  const estimatedTime = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === "completed");
    const remainingTasks = tasks.filter(t => t.status === "pending" || t.status === "transcoding");

    if (remainingTasks.length === 0) return "";
    if (completedTasks.length === 0) return "";

    // Simple estimation: assume similar times for remaining files
    return `~${remainingTasks.length} ${pluralize(remainingTasks.length, "file")} remaining`;
  }, [tasks]);

  const handleFilesSelect = async (paths: string[]) => {
    setError(null);

    const newMetadata: (MediaMetadata | null)[] = [];
    for (const path of paths) {
      try {
        const meta = await invoke<MediaMetadata>("get_media_info", {
          filePath: path,
        });
        newMetadata.push(meta);
      } catch (err) {
        logger.error("Failed to fetch metadata:", err);
        newMetadata.push(null);
      }
    }

    setSelectedFiles((prev) => {
      const newPaths = paths.filter((p) => !prev.includes(p));
      return [...prev, ...newPaths];
    });

    setMetadataList((prev) => [...prev, ...newMetadata]);

    if (paths.length > 0) {
      setOutputDir((prev) => {
        if (!prev && appSettings.rememberOutputDir && appSettings.defaultOutputDir) {
          return appSettings.defaultOutputDir;
        }
        if (!prev) {
          const firstPath = paths[0];
          const dirMatch = firstPath.match(/^(.*[/\\])/);
          return dirMatch ? dirMatch[1] : "";
        }
        return prev;
      });
    }

    setTasks((prev) => {
      const newTasks = [...prev];
      const { suffix, ext } = getPresetOutputInfo(selectedPreset);

      for (const path of paths) {
        if (newTasks.some((task) => task.id === path)) {
          continue;
        }
        const originalFileName = getFileName(path);
        const baseFileName = getBaseFileName(path);

        newTasks.push({
          id: path,
          inputPath: path,
          outputFileName: baseFileName,
          suffix,
          extension: ext,
          status: "pending",
          progress: null,
          originalFileName,
          segment: null,
          preset: undefined, // Use global preset by default
        });
      }
      return newTasks;
    });

    setTaskDurations((prev) => {
      const newDurations = new Map(prev);
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        const meta = newMetadata[i];
        if (meta) {
          newDurations.set(path, meta.duration_sec);
        }
      }
      return newDurations;
    });
  };

  async function handleBrowse() {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Video Files",
            extensions: VIDEO_EXTENSIONS,
          },
        ],
      });
      if (typeof selected === "string") {
        await handleFilesSelect([selected]);
      } else if (Array.isArray(selected) && selected.length > 0) {
        await handleFilesSelect(selected);
      }
    } catch (err) {
      logger.error("Failed to open file dialog:", err);
    }
  }

  const handleRemoveTask = (id: string) => {
    setSelectedFiles((prevFiles) => {
      const index = prevFiles.indexOf(id);
      setMetadataList((prevMeta) =>
        index >= 0 ? prevMeta.filter((_, i) => i !== index) : prevMeta
      );
      return prevFiles.filter((path) => path !== id);
    });
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setTaskDurations((prev) => {
      const newDurations = new Map(prev);
      newDurations.delete(id);
      return newDurations;
    });
    setExpandedCardIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleClearCompleted = () => {
    const completedIds = tasks.filter((t) => t.status === "completed").map((t) => t.id);
    if (completedIds.length === 0) return;

    setSelectedFiles((prev) => prev.filter((path) => !completedIds.includes(path)));
    setTasks((prev) => prev.filter((task) => task.status !== "completed"));

    // Also clean up metadata and durations
    setMetadataList((prev) => {
      const indicesToRemove: number[] = [];
      completedIds.forEach((id) => {
        const index = prev.findIndex((m) => m?.file_path === id);
        if (index >= 0) indicesToRemove.push(index);
      });
      return prev.filter((_, i) => !indicesToRemove.includes(i));
    });

    setTaskDurations((prev) => {
      const newDurations = new Map(prev);
      completedIds.forEach((id) => newDurations.delete(id));
      return newDurations;
    });

    // Also clean up expanded card IDs
    setExpandedCardIds((prev) => {
      const newSet = new Set(prev);
      completedIds.forEach((id) => newSet.delete(id));
      return newSet;
    });
  };

  const handleStartBatchTranscode = async () => {
    if (tasks.length === 0 || !outputDir) return;

    for (const task of tasks) {
      if (task.segment) {
        const duration = taskDurations.get(task.id) ?? 0;
        const seg = task.segment;
        if (seg.start_sec >= duration) {
          setError(ERROR_MESSAGES.INVALID_SEGMENT_START(task.originalFileName));
          return;
        }
        if (seg.end_sec !== null && seg.end_sec <= seg.start_sec) {
          setError(ERROR_MESSAGES.INVALID_SEGMENT_END(task.originalFileName));
          return;
        }
      }
    }

    setError(null);
    setIsTranscoding(true);

    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        status: "transcoding" as const,
        progress: null,
      }))
    );

    // Group tasks by preset (since backend doesn't support per-file presets)
    const tasksByPreset = tasks.reduce((groups, task) => {
      const preset = getEffectivePreset(task, selectedPreset);
      if (!groups[preset]) groups[preset] = [];
      groups[preset].push(task);
      return groups;
    }, {} as Record<OutputPreset, FileTask[]>);

    try {
      // Process each preset group sequentially
      for (const [preset, presetTasks] of Object.entries(tasksByPreset)) {
        const inputPaths = presetTasks.map((t) => t.inputPath);
        const outputPaths = presetTasks.map((t) => getOutputPath(t, outputDir));
        const segments = presetTasks.map((t) => t.segment);

        const batchId = await invoke("start_batch_transcode", {
          request: {
            input_paths: inputPaths,
            output_paths: outputPaths,
            preset: preset as OutputPreset,
            segments: segments,
          },
        });

        // Only set the first batchId (subsequent batches will share progress tracking)
        if (!currentBatchId) {
          setCurrentBatchId(batchId as string);
        }
      }
    } catch (err) {
      setIsTranscoding(false);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    }
  };

  // Keyboard shortcuts (declared after functions to use them)
  useKeyboardShortcuts([
    {
      key: "o",
      ctrlKey: true,
      handler: handleBrowse,
      description: "Add files",
    },
    {
      key: ",",
      ctrlKey: true,
      handler: settingsModal.open,
      description: "Open settings",
    },
    {
      key: "Enter",
      ctrlKey: true,
      handler: handleStartBatchTranscode,
      description: "Start transcoding",
    },
    {
      key: "Escape",
      handler: () => {
        if (settingsModal.isOpen) settingsModal.close();
        // Clear all expanded cards
        setExpandedCardIds(new Set());
      },
      description: "Close dialogs/collapse cards",
    },
  ]);

  const completedCount = tasks.filter(t => t.status === "completed").length;
  const failedCount = tasks.filter(t => t.status === "failed").length;

  if (checking) {
    return (
      <div className="app-layout">
        <div className="empty-state">
          <p>Checking ffmpeg availability...</p>
        </div>
      </div>
    );
  }

  if (!ffmpegAvailable) {
    return (
      <div className="app-layout">
        <div className="empty-state">
          <h2>FFmpeg Not Found</h2>
          <p>
            This app requires ffmpeg and ffprobe to be installed on your system.
            Please install ffmpeg and ensure it&apos;s in your system PATH.
          </p>
          <a
            href="https://ffmpeg.org/download.html"
            target="_blank"
            rel="noreferrer"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            Download FFmpeg
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-header-title">Transcoder</h1>
        <button
          className="text-button settings-button"
          onClick={settingsModal.open}
          title="Settings"
          aria-label="Open Settings"
        >
          Settings
        </button>
      </header>

      {/* Main Body */}
      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <SidebarPanel
            selectedPreset={selectedPreset}
            onPresetChange={handleGlobalPresetChange}
            outputDir={outputDir}
            onOutputDirChange={setOutputDir}
            estimatedSize={estimatedTotalSize}
            fileCount={tasks.length}
            onAddFiles={handleBrowse}
            onStartTranscode={handleStartBatchTranscode}
            isTranscoding={isTranscoding}
            canStart={tasks.length > 0 && !!outputDir}
            completedCount={completedCount}
            onClearCompleted={handleClearCompleted}
          />
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="file-queue-container">
            {tasks.length === 0 ? (
              <FileDropZone
                onFilesDrop={handleFilesSelect}
                onAddFiles={handleBrowse}
                disabled={isTranscoding}
              />
            ) : (
              <div className="file-queue-wrapper">
                <div className="file-queue-header">
                  <h2 className="file-queue-title">
                    Queue
                    <span className="file-queue-count">({tasks.length} {pluralize(tasks.length, "file")})</span>
                  </h2>
                </div>
                <FileQueue
                  tasks={tasks}
                  metadataList={metadataList}
                  globalPreset={selectedPreset}
                  onRemoveTask={handleRemoveTask}
                  onUpdateTask={handleUpdateTask}
                  onApplyToAll={handleApplyToAll}
                  expandedCardIds={expandedCardIds}
                  onToggleExpand={handleToggleExpand}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <StatusBar
        completedCount={completedCount}
        totalCount={tasks.length}
        failedCount={failedCount}
        estimatedTime={estimatedTime}
      />

      {/* Modals */}
      <SettingsDialog
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.close}
        settings={appSettings}
        onSettingsChange={setAppSettings}
      />

      {/* Error Message */}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
    </div>
  );
}

export default App;
