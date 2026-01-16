import type { FileTask, OutputPreset } from "../types";
import { TimeRangeInput } from "./TimeRangeInput";

interface BatchQueueProps {
  tasks: FileTask[];
  outputDir: string;
  selectedPreset: OutputPreset;
  onRemoveTask: (id: string) => void;
  onUpdateFileName: (id: string, newFileName: string) => void;
  onUpdateSegment?: (id: string, segment: import("../types").TimeSegment | null) => void;
  taskDurations?: Map<string, number>;  // Map of task ID to duration in seconds
}

const statusIcons: Record<FileTask["status"], string> = {
  pending: "⏳",
  transcoding: "⚙️",
  completed: "✅",
  failed: "❌",
};

const statusLabels: Record<FileTask["status"], string> = {
  pending: "Waiting",
  transcoding: "Transcoding...",
  completed: "Completed",
  failed: "Failed",
};

export function BatchQueue({
  tasks,
  outputDir: _outputDir,  // Reserved for future use (e.g., showing full output path)
  selectedPreset,
  onRemoveTask,
  onUpdateFileName,
  onUpdateSegment,
  taskDurations,
}: BatchQueueProps) {
  if (tasks.length === 0) return null;

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;
  const totalCount = tasks.length;
  const overallProgress =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Get suffix and extension for the current preset
  function getPresetInfo(preset: OutputPreset): { suffix: string; ext: string } {
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

  const { suffix: currentSuffix, ext: currentExt } = getPresetInfo(selectedPreset);

  return (
    <div className="batch-queue">
      <div className="queue-header">
        <h3>Queue ({totalCount} file{totalCount > 1 ? "s" : ""})</h3>
        <button
          className="clear-button"
          onClick={() => {
            for (const task of tasks) {
              if (task.status === "completed" || task.status === "failed") {
                onRemoveTask(task.id);
              }
            }
          }}
          disabled={completedCount + failedCount === 0}
        >
          Clear Completed
        </button>
      </div>

      <div className="queue-list">
        {tasks.map((task) => (
          <div key={task.id} className={`queue-item status-${task.status}`}>
            <div className="queue-item-header">
              <span className="file-info">
                <span className="status-icon">{statusIcons[task.status]}</span>
                <span className="file-name" title={task.inputPath}>
                  {task.originalFileName}
                </span>
              </span>
              <span className="status-label">{statusLabels[task.status]}</span>
            </div>

            {/* Output file name editor */}
            <div className="output-filename-editor">
              <span className="output-label">Output:</span>
              <input
                type="text"
                className="filename-input"
                value={task.outputFileName}
                onChange={(e) => onUpdateFileName(task.id, e.target.value)}
                disabled={task.status !== "pending"}
                placeholder="Enter file name"
              />
              <span className="file-extension">
                {task.suffix}
                {task.extension}
              </span>
            </div>

            {/* Show preset mismatch warning if needed */}
            {selectedPreset !== "ProRes422" &&
              (task.suffix !== currentSuffix || task.extension !== currentExt) && (
                <div className="preset-update-notice">
                  This file will use {currentSuffix}
                  {currentExt} when transcoding starts
                </div>
              )}

            {/* Time range input for pending tasks */}
            {task.status === "pending" && onUpdateSegment && taskDurations && (
              <TimeRangeInput
                duration={taskDurations.get(task.id) ?? 0}
                segment={task.segment}
                onChange={(segment) => onUpdateSegment(task.id, segment)}
                disabled={task.status !== "pending"}
              />
            )}

            {task.status === "transcoding" && task.progress && (
              <div className="queue-item-progress">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${task.progress.progress_percent}%` }}
                  />
                </div>
                <div className="progress-info">
                  <span>{task.progress.progress_percent.toFixed(0)}%</span>
                  {task.progress.fps && (
                    <span> · {task.progress.fps.toFixed(1)} fps</span>
                  )}
                </div>
              </div>
            )}

            {task.status === "pending" && (
              <div className="queue-item-progress">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill waiting" />
                </div>
              </div>
            )}

            {task.status === "completed" && (
              <div className="queue-item-progress">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill completed" />
                </div>
              </div>
            )}

            {task.status === "failed" && (
              <div className="error-badge">Transcoding failed</div>
            )}

            {task.status === "pending" && (
              <button
                className="remove-task-button"
                onClick={() => onRemoveTask(task.id)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="overall-progress">
        <span className="overall-label">
          Overall: {completedCount}/{totalCount} completed
        </span>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill overall"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        {failedCount > 0 && (
          <span className="failed-count">{failedCount} failed</span>
        )}
      </div>
    </div>
  );
}
