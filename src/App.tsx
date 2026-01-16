import { useState, useEffect, useMemo } from "react";
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
import { EditFileDialog } from "./components/EditFileDialog";
import { ErrorMessage } from "./components/ErrorMessage";
import { Dropdown, type DropdownItem } from "./components/ui/Dropdown";
import type {
  OutputPreset,
  MediaMetadata,
  FileTask,
  BatchProgress,
  TimeSegment,
  AppSettings,
} from "./types";
import { getOutputPath, getPresetOutputInfo } from "./types";
import { PRESET_INFO } from "./presetInfo";

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
    console.error("Failed to read folder:", error);
    return [];
  }
}

// Calculate estimated output file size
function estimateOutputSize(
  metadata: MediaMetadata | null,
  preset: OutputPreset
): { minMB: number; maxMB: number } {
  if (!metadata) return { minMB: 0, maxMB: 0 };

  if (preset === "H264Crf18") {
    const pixels = metadata.video.width * metadata.video.height;
    const baselinePixels = 1920 * 1080;
    const resolutionFactor = pixels / baselinePixels;

    const minSizePerMin = 15 * resolutionFactor;
    const maxSizePerMin = 45 * resolutionFactor;

    const durationMin = metadata.duration_sec / 60;
    return {
      minMB: minSizePerMin * durationMin,
      maxMB: maxSizePerMin * durationMin,
    };
  }

  const presetInfo = PRESET_INFO[preset];
  const baseBitrate = presetInfo.bitrateMbps * 1_000_000;

  const pixels = metadata.video.width * metadata.video.height;
  const baselinePixels = 1920 * 1080;
  const resolutionFactor = pixels / baselinePixels;

  const adjustedBitrate = baseBitrate * resolutionFactor;
  const totalBits = adjustedBitrate * metadata.duration_sec;
  const totalMB = totalBits / 8 / (1024 ** 2);

  return { minMB: totalMB, maxMB: totalMB };
}

// Format size for display
function formatSize(sizeMB: number): string {
  if (sizeMB >= 1024) {
    return `~${(sizeMB / 1024).toFixed(1)} GB`;
  }
  return `~${sizeMB.toFixed(0)} MB`;
}

// Format size range for display
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

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  defaultPreset: "ProRes422",
  defaultOutputDir: "",
  rememberOutputDir: false,
  defaultSegmentLength: 30,
};

function App() {
  // UI State
  const settingsModal = useModal();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // File and task state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [metadataList, setMetadataList] = useState<(MediaMetadata | null)[]>([]);
  const [outputDir, setOutputDir] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<OutputPreset>(DEFAULT_SETTINGS.defaultPreset);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Batch task tracking
  const [tasks, setTasks] = useState<FileTask[]>([]);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [taskDurations, setTaskDurations] = useState<Map<string, number>>(new Map());

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
        console.error("Failed to parse saved settings:", e);
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
      console.log("Using bundled FFmpeg from ffmpeg/ folder");
    }
  }, [ffmpegSource]);

  // Listen for batch progress updates
  useEffect(() => {
    const unlisten = listen<BatchProgress>("batch-transcode-progress", (event) => {
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

  // Legacy listeners for single-file mode (kept for compatibility)
  useEffect(() => {
    const unlistenComplete = listen("transcode-complete", () => {
      setIsTranscoding(false);
    });

    const unlistenError = listen("transcode-error", () => {
      setIsTranscoding(false);
      setError("Transcoding failed. Check that ffmpeg is installed and the input file is valid.");
    });

    return () => {
      unlistenComplete.then((fn) => fn());
      unlistenError.then((fn) => fn());
    };
  }, []);

  // Update suffix and extension when preset changes
  useEffect(() => {
    if (tasks.length > 0) {
      const { suffix, ext } = getPresetOutputInfo(selectedPreset);
      setTasks((prevTasks) =>
        prevTasks.map((task) => ({
          ...task,
          suffix,
          extension: ext,
        }))
      );
    }
  }, [selectedPreset]);

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

  // Calculate estimated total size
  const estimatedTotalSize = useMemo(() => {
    if (tasks.length === 0) return "Select video files";

    let totalMinMB = 0;
    let totalMaxMB = 0;

    for (const task of tasks) {
      const metaIndex = selectedFiles.indexOf(task.id);
      const meta = metaIndex >= 0 ? metadataList[metaIndex] : null;
      if (!meta) continue;

      const segmentDuration = task.segment
        ? (task.segment.end_sec ?? meta.duration_sec) - task.segment.start_sec
        : meta.duration_sec;
      const adjustedMeta = { ...meta, duration_sec: segmentDuration };
      const size = estimateOutputSize(adjustedMeta, selectedPreset);
      totalMinMB += size.minMB;
      totalMaxMB += size.maxMB;
    }

    return formatSizeRange(totalMinMB, totalMaxMB);
  }, [tasks, selectedFiles, metadataList, selectedPreset]);

  // Get estimated size for a specific task
  const getEstimatedSizeForTask = (taskId: string): string => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return "~0 MB";

    const metaIndex = selectedFiles.indexOf(taskId);
    const meta = metaIndex >= 0 ? metadataList[metaIndex] : null;
    if (!meta) return "~0 MB";

    const segmentDuration = task.segment
      ? (task.segment.end_sec ?? meta.duration_sec) - task.segment.start_sec
      : meta.duration_sec;
    const adjustedMeta = { ...meta, duration_sec: segmentDuration };
    const size = estimateOutputSize(adjustedMeta, selectedPreset);

    return formatSizeRange(size.minMB, size.maxMB);
  };

  // Calculate estimated time remaining
  const estimatedTime = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === "completed");
    const remainingTasks = tasks.filter(t => t.status === "pending" || t.status === "transcoding");

    if (remainingTasks.length === 0) return "";
    if (completedTasks.length === 0) return "";

    // Simple estimation: assume similar times for remaining files
    return `~${remainingTasks.length} file${remainingTasks.length > 1 ? "s" : ""} remaining`;
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
        console.error("Failed to fetch metadata:", err);
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
      if (selected && selected.length > 0) {
        await handleFilesSelect(selected as string[]);
      }
    } catch (err) {
      console.error("Failed to open file dialog:", err);
    }
  }

  async function handleBrowseFolder() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected) {
        const videoFiles = await readVideoFilesFromFolder(selected as string);
        if (videoFiles.length > 0) {
          await handleFilesSelect(videoFiles);
        }
      }
    } catch (err) {
      console.error("Failed to open folder dialog:", err);
    }
  }

  function handleClearAllFiles() {
    setSelectedFiles([]);
    setMetadataList([]);
    setTasks([]);
    setTaskDurations(new Map());
    setError(null);
  }

  function handleClearCompleted() {
    const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "failed");
    for (const task of completedTasks) {
      handleRemoveTask(task.id);
    }
  }

  const handleRemoveTask = (id: string) => {
    setSelectedFiles((prev) => prev.filter((path) => path !== id));
    setMetadataList((prev) => {
      const index = selectedFiles.indexOf(id);
      return index >= 0 ? prev.filter((_, i) => i !== index) : prev;
    });
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setTaskDurations((prev) => {
      const newDurations = new Map(prev);
      newDurations.delete(id);
      return newDurations;
    });
  };

  const handleUpdateTask = (id: string, updates: Partial<FileTask>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  };

  const handleApplySegmentToAll = (segment: TimeSegment | null) => {
    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        segment,
      }))
    );
  };

  const handleStartBatchTranscode = async () => {
    if (tasks.length === 0 || !outputDir) return;

    for (const task of tasks) {
      if (task.segment) {
        const duration = taskDurations.get(task.id) ?? 0;
        const seg = task.segment;
        if (seg.start_sec >= duration) {
          setError(`Invalid segment start time for ${task.originalFileName}`);
          return;
        }
        if (seg.end_sec !== null && seg.end_sec <= seg.start_sec) {
          setError(`Invalid segment end time for ${task.originalFileName}`);
          return;
        }
      }
    }

    setError(null);
    setIsTranscoding(true);

    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        status: "pending" as const,
        progress: null,
      }))
    );

    try {
      const inputPaths = tasks.map((t) => t.inputPath);
      const outputPaths = tasks.map((t) => getOutputPath(t, outputDir));
      const segments = tasks.map((t) => t.segment);

      const batchId = await invoke("start_batch_transcode", {
        request: {
          input_paths: inputPaths,
          output_paths: outputPaths,
          preset: selectedPreset,
          segments: segments,
        },
      });
      setCurrentBatchId(batchId as string);
    } catch (err) {
      setIsTranscoding(false);
      setError(err as string);
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
        if (editingTaskId) setEditingTaskId(null);
        if (settingsModal.isOpen) settingsModal.close();
      },
      description: "Close dialogs",
    },
  ]);

  // File menu items
  const fileMenuItems: DropdownItem[] = [
    { label: "Add Files...", onClick: handleBrowse, icon: "📄" },
    { label: "Add Folder...", onClick: handleBrowseFolder, icon: "📁" },
    { label: "", onClick: () => {}, divider: true },
    { label: "Clear All Files", onClick: handleClearAllFiles, icon: "🗑" },
    { label: "Clear Completed", onClick: handleClearCompleted, icon: "✓" },
  ];

  const completedCount = tasks.filter(t => t.status === "completed").length;
  const failedCount = tasks.filter(t => t.status === "failed").length;

  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;
  const editingTaskMetadata = editingTask
    ? metadataList[selectedFiles.indexOf(editingTaskId!)] ?? null
    : null;

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
        <h1 className="app-header-title">Editing Transcoder</h1>
        <div className="app-header-actions">
          <button
            className="icon-button"
            onClick={settingsModal.open}
            title="Settings"
          >
            ⚙
          </button>
          <Dropdown
            trigger={<span className="dropdown-trigger-text">📁 ▼</span>}
            items={fileMenuItems}
          />
        </div>
      </header>

      {/* Main Body */}
      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <SidebarPanel
            selectedPreset={selectedPreset}
            onPresetChange={setSelectedPreset}
            outputDir={outputDir}
            onOutputDirChange={setOutputDir}
            estimatedSize={estimatedTotalSize}
            fileCount={tasks.length}
            onAddFiles={handleBrowse}
            onStartTranscode={handleStartBatchTranscode}
            isTranscoding={isTranscoding}
            canStart={tasks.length > 0 && !!outputDir}
          />
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="file-queue-container">
            {tasks.length === 0 ? (
              <FileDropZone onFilesDrop={handleFilesSelect} disabled={isTranscoding} />
            ) : (
              <>
                <div className="file-queue-header">
                  <h2 className="file-queue-title">
                    Queue
                    <span className="file-queue-count">({tasks.length} file{tasks.length > 1 ? "s" : ""})</span>
                  </h2>
                </div>
                <FileQueue
                  tasks={tasks}
                  metadataList={metadataList}
                  taskDurations={taskDurations}
                  selectedPreset={selectedPreset}
                  onEditFile={setEditingTaskId}
                  onRemoveTask={handleRemoveTask}
                />
              </>
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

      {editingTask && editingTaskMetadata && (
        <EditFileDialog
          isOpen={!!editingTaskId}
          onClose={() => setEditingTaskId(null)}
          task={editingTask}
          metadata={editingTaskMetadata}
          preset={selectedPreset}
          estimatedSize={getEstimatedSizeForTask(editingTaskId!)}
          onUpdateTask={(updates) => handleUpdateTask(editingTaskId!, updates)}
          onApplyToAll={handleApplySegmentToAll}
          disabled={isTranscoding}
        />
      )}

      {/* Error Message */}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
    </div>
  );
}

export default App;
