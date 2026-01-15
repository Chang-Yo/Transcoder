import type { FileTask } from "../types";

interface BatchQueueProps {
  tasks: FileTask[];
  onRemoveTask: (index: number) => void;
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

export function BatchQueue({ tasks, onRemoveTask }: BatchQueueProps) {
  if (tasks.length === 0) return null;

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;
  const totalCount = tasks.length;
  const overallProgress = totalCount > 0
    ? (completedCount / totalCount) * 100
    : 0;

  return (
    <div className="batch-queue">
      <div className="queue-header">
        <h3>Queue ({totalCount} file{totalCount > 1 ? "s" : ""})</h3>
        <button
          className="clear-button"
          onClick={() => {
            for (let i = tasks.length - 1; i >= 0; i--) {
              if (tasks[i].status === "completed" || tasks[i].status === "failed") {
                onRemoveTask(i);
              }
            }
          }}
          disabled={completedCount + failedCount === 0}
        >
          Clear Completed
        </button>
      </div>

      <div className="queue-list">
        {tasks.map((task, index) => (
          <div key={index} className={`queue-item status-${task.status}`}>
            <div className="queue-item-header">
              <span className="file-info">
                <span className="status-icon">{statusIcons[task.status]}</span>
                <span className="file-name" title={task.inputPath}>
                  {task.fileName}
                </span>
              </span>
              <span className="status-label">{statusLabels[task.status]}</span>
            </div>

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
                onClick={() => onRemoveTask(index)}
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
