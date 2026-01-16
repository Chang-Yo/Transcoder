import type { FileTask, OutputPreset, MediaMetadata } from "../types";
import { FileCard } from "./FileCard";
import "./FileQueue.css";

export interface FileQueueProps {
  tasks: FileTask[];
  metadataList: (MediaMetadata | null)[];
  taskDurations: Map<string, number>;
  selectedPreset: OutputPreset;
  onEditFile: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
}

export function FileQueue({
  tasks,
  metadataList,
  taskDurations: _taskDurations,
  selectedPreset,
  onEditFile,
  onRemoveTask,
}: FileQueueProps) {
  if (tasks.length === 0) {
    return (
      <div className="file-queue file-queue-empty">
        <p className="file-queue-empty-text">No files in queue</p>
      </div>
    );
  }

  return (
    <div className="file-queue">
      <div className="file-queue-list">
        {tasks.map((task) => {
          const metadata = metadataList.find((_, i) => {
            // Find metadata by task input path
            const pathIndex = tasks.findIndex(t => t.id === task.id);
            return pathIndex === i;
          }) ?? null;

          return (
            <FileCard
              key={task.id}
              task={task}
              metadata={metadata}
              preset={selectedPreset}
              estimatedSize="~MB" // Will be calculated by parent
              progress={task.progress}
              onEdit={() => onEditFile(task.id)}
              onRemove={() => onRemoveTask(task.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
