import { useState, useEffect, useRef } from "react";
import type { FileTask, MediaMetadata, TimeSegment } from "../types";
import { secondsToTimecode, getSegmentDuration, FILE_TASK_STATUS_LABELS } from "../types";
import { TimeRangeInput } from "./TimeRangeInput";
import "./FileCard.css";

export interface FileCardProps {
  task: FileTask;
  metadata: MediaMetadata | null;
  estimatedSize: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onUpdateTask: (updates: Partial<FileTask>) => void;
  onRemove: () => void;
  onApplyToAll: (updates: Partial<FileTask>) => void;
}

export function FileCard({
  task,
  metadata,
  estimatedSize,
  isExpanded = false,
  onToggleExpand,
  onUpdateTask,
  onRemove,
  onApplyToAll,
}: FileCardProps) {
  const [fileName, setFileName] = useState(task.outputFileName);
  const [localSegment, setLocalSegment] = useState<TimeSegment | null>(task.segment);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Sync local state with task changes
  useEffect(() => {
    setFileName(task.outputFileName);
    setLocalSegment(task.segment);
  }, [task]);

  const ensureCardVisible = () => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    // Simple approach: scroll card into view
    cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // Ensure expanded card content is fully visible without manual scrolling
  useEffect(() => {
    if (!isExpanded) return;
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const rafId = requestAnimationFrame(() => {
      ensureCardVisible();
    });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        ensureCardVisible();
      });
      observer.observe(cardEl);
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
    };
  }, [isExpanded]);

  const hasSegment = localSegment !== null;
  const segmentDisplay = hasSegment && metadata && localSegment
    ? `${secondsToTimecode(localSegment.start_sec)} - ${
        localSegment.end_sec !== null
          ? secondsToTimecode(localSegment.end_sec)
          : "End"
      }`
    : null;

  const duration = metadata?.duration_sec ?? 0;
  const segmentDuration = getSegmentDuration(localSegment, duration);

  // Handle summary click (expand/collapse)
  const handleSummaryClick = (e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLInputElement ||
      (e.target as HTMLElement).closest('button, input')
    ) {
      return;
    }
    onToggleExpand?.();
  };

  // Handle file name change
  const handleFileNameChange = (value: string) => {
    // Only allow valid filename characters
    const sanitized = value.replace(/[<>:"/\\|?*]/g, "");
    setFileName(sanitized);
  };

  const handleFileNameBlur = () => {
    const trimmed = fileName.trim() || task.outputFileName;
    setFileName(trimmed);
    if (trimmed !== task.outputFileName) {
      onUpdateTask({ outputFileName: trimmed });
    }
  };

  // Handle segment change
  const handleSegmentChange = (segment: TimeSegment | null) => {
    setLocalSegment(segment);
    // Immediately apply segment changes
    onUpdateTask({ segment });
  };

  // Apply to all
  const handleApplyToAll = () => {
    onApplyToAll({
      outputFileName: fileName.trim() || task.outputFileName,
      segment: localSegment,
    });
    onToggleExpand?.(); // Collapse after applying
  };

  return (
    <div
      ref={cardRef}
      className={`file-card status-${task.status} ${isExpanded ? "expanded" : ""}`}
    >
      {/* Summary (always visible, clickable to expand) */}
      <div className="file-card-summary" onClick={handleSummaryClick}>
        <button
          type="button"
          className={`file-card-expand-toggle ${isExpanded ? "expanded" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          ▼
        </button>

        <div className="file-card-main">
          <div className="file-card-header">
            <span className={`file-card-status-label status-${task.status}`}>
              {FILE_TASK_STATUS_LABELS[task.status]}
            </span>
            <span className="file-card-name" title={task.inputPath}>
              {task.originalFileName}
            </span>
            <span className="file-card-size">{estimatedSize}</span>
          </div>

          <div className="file-card-info">
            {segmentDisplay && (
              <span className="file-card-segment" title="Time range">
                {segmentDisplay}
              </span>
            )}
          </div>

          {/* Progress bar for transcoding */}
          {task.status === "transcoding" && task.progress && (
            <div className="file-card-progress">
              <div className="file-card-progress-bar">
                <div
                  className="file-card-progress-fill"
                  style={{ width: `${task.progress.progress_percent}%` }}
                />
              </div>
              <span className="file-card-progress-text">
                {task.progress.progress_percent.toFixed(0)}%
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
          {task.status === "pending" && (
            <button
              type="button"
              className="file-card-action-btn file-card-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove from queue"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="file-card-expanded-content">
          {/* Filename section */}
          <div className="file-card-expanded-section">
            <span className="section-label">Output Filename</span>
            <div className="file-card-filename-input">
              <input
                type="text"
                value={fileName}
                onChange={(e) => handleFileNameChange(e.target.value)}
                onBlur={handleFileNameBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                disabled={task.status === "transcoding"}
                placeholder="Enter filename"
                className="file-card-filename-field"
              />
              <span className="file-card-extension">
                {task.suffix}
                {task.extension}
              </span>
            </div>
          </div>

          {/* Time Range section */}
          {metadata && (
            <div className="file-card-expanded-section">
              <span className="section-label">Time Range</span>
              <TimeRangeInput
                duration={duration}
                segment={localSegment}
                onChange={handleSegmentChange}
                disabled={task.status === "transcoding"}
              />
            </div>
          )}

          {/* File Info section */}
          {metadata && (
            <div className="file-card-expanded-section">
              <span className="section-label">File Info</span>
              <div className="file-card-metadata-grid">
                <span className="metadata-item">
                  {metadata.video.width}×{metadata.video.height}
                </span>
                <span className="metadata-item">
                  {metadata.video.framerate} fps
                </span>
                <span className="metadata-item">
                  {secondsToTimecode(metadata.duration_sec)}
                </span>
                <span className="metadata-item">
                  {metadata.video.codec}
                </span>
                <span className="metadata-item">
                  {metadata.video.bit_depth}-bit
                </span>
                <span className="metadata-item">
                  {metadata.video.chroma_subsampling}
                </span>
              </div>
            </div>
          )}

          {/* Estimated size section */}
          <div className="file-card-expanded-section size-section">
            <span className="size-label">Estimated: {estimatedSize}</span>
            {hasSegment && metadata && (
              <span className="segment-duration-label">
                Time Range: {secondsToTimecode(segmentDuration)}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="file-card-expanded-actions">
            <button
              type="button"
              className="file-card-apply-all-btn"
              onClick={handleApplyToAll}
              disabled={task.status === "transcoding"}
            >
              Apply to All
            </button>
            <button
              type="button"
              className="file-card-remove-btn"
              onClick={onRemove}
              disabled={task.status === "transcoding"}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
