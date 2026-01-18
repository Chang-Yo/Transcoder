import type { FileTask, OutputPreset, MediaMetadata } from "../types";
import { formatSizeRange, getEstimatedSizeRange } from "../types";
import { FileCard } from "./FileCard";
import "./FileQueue.css";

export interface FileQueueProps {
  tasks: FileTask[];
  metadataList: (MediaMetadata | null)[];
  globalPreset: OutputPreset;
  onRemoveTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<FileTask>) => void;
  onApplyToAll: (updates: Partial<FileTask>) => void;
  expandedCardIds: Set<string>;
  onToggleExpand: (taskId: string) => void;
}

function getEstimatedSizeForTask(
  task: FileTask,
  metadata: MediaMetadata | null,
  preset: OutputPreset
): string {
  const sizeRange = getEstimatedSizeRange(task, metadata, preset);
  if (!sizeRange) return formatSizeRange(0, 0);
  return formatSizeRange(sizeRange.minMB, sizeRange.maxMB);
}

export function FileQueue({
  tasks,
  metadataList,
  globalPreset,
  onRemoveTask,
  onUpdateTask,
  onApplyToAll,
  expandedCardIds,
  onToggleExpand,
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
        {tasks.map((task, index) => {
          const metadata = metadataList[index] ?? null;
          const isExpanded = expandedCardIds.has(task.id);

          return (
            <FileCard
              key={task.id}
              task={task}
              metadata={metadata}
              globalPreset={globalPreset}
              estimatedSize={getEstimatedSizeForTask(task, metadata, task.preset ?? globalPreset)}
              isExpanded={isExpanded}
              onToggleExpand={() => onToggleExpand(task.id)}
              onUpdateTask={(updates) => onUpdateTask(task.id, updates)}
              onRemove={() => onRemoveTask(task.id)}
              onApplyToAll={onApplyToAll}
            />
          );
        })}
      </div>
    </div>
  );
}
