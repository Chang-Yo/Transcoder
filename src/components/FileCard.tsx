import type { FileTask, OutputPreset, MediaMetadata, TranscodeProgress } from "../types";
import { secondsToTimecode } from "../types";
import "./FileCard.css";

const STATUS_ICONS: Record<FileTask["status"], string> = {
  pending: "⏳",
  transcoding: "⚙️",
  completed: "✅",
  failed: "❌",
};

export interface FileCardProps {
  task: FileTask;
  metadata: MediaMetadata | null;
  preset: OutputPreset;
  estimatedSize: string;
  progress?: TranscodeProgress | null;
  onEdit: () => void;
  onRemove: () => void;
}

export function FileCard({
  task,
  metadata,
  preset,
  estimatedSize,
  progress,
  onEdit,
  onRemove,
}: FileCardProps) {
  const hasSegment = task.segment !== null;
  const segmentDisplay = hasSegment && metadata
    ? `${secondsToTimecode(task.segment!.start_sec)} - ${
        task.segment!.end_sec !== null
          ? secondsToTimecode(task.segment!.end_sec)
          : "End"
      }`
    : null;

  return (
    <div className={`file-card status-${task.status}`}>
      <div className="file-card-main">
        <div className="file-card-header">
          <span className="file-card-status-icon">{STATUS_ICONS[task.status]}</span>
          <span className="file-card-name" title={task.inputPath}>
            {task.originalFileName}
          </span>
          <span className="file-card-size">{estimatedSize}</span>
        </div>

        <div className="file-card-info">
          {segmentDisplay && (
            <span className="file-card-segment" title="Time range">
              🎬 {segmentDisplay}
            </span>
          )}
          <span className="file-card-preset">{preset}</span>
        </div>

        {/* Progress bar for transcoding */}
        {task.status === "transcoding" && progress && (
          <div className="file-card-progress">
            <div className="file-card-progress-bar">
              <div
                className="file-card-progress-fill"
                style={{ width: `${progress.progress_percent}%` }}
              />
            </div>
            <span className="file-card-progress-text">
              {progress.progress_percent.toFixed(0)}%
            </span>
          </div>
        )}

        {/* Completed progress bar */}
        {task.status === "completed" && (
          <div className="file-card-progress">
            <div className="file-card-progress-bar">
              <div className="file-card-progress-fill completed" />
            </div>
          </div>
        )}

        {/* Failed indicator */}
        {task.status === "failed" && (
          <div className="file-card-error">Transcoding failed</div>
        )}
      </div>

      <div className="file-card-actions">
        <button
          type="button"
          className="file-card-action-btn file-card-edit"
          onClick={onEdit}
          disabled={task.status === "transcoding"}
          title="Edit file settings"
        >
          ✏
        </button>
        {task.status === "pending" && (
          <button
            type="button"
            className="file-card-action-btn file-card-remove"
            onClick={onRemove}
            title="Remove from queue"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
