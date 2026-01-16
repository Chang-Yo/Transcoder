import { useState, useEffect } from "react";
import { Modal, type ModalProps } from "./ui/Modal";
import { TimeRangeInput } from "./TimeRangeInput";
import type { FileTask, MediaMetadata, TimeSegment, OutputPreset } from "../types";
import { secondsToTimecode, getSegmentDuration } from "../types";
import { PRESET_DISPLAY_NAMES } from "../presetInfo";
import "./EditFileDialog.css";

export interface EditFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: FileTask;
  metadata: MediaMetadata | null;
  preset: OutputPreset;
  estimatedSize: string;
  onUpdateTask: (updates: Partial<FileTask>) => void;
  onApplyToAll: (segment: TimeSegment | null) => void;
  disabled?: boolean;
}

export function EditFileDialog({
  isOpen,
  onClose,
  task,
  metadata,
  preset,
  estimatedSize,
  onUpdateTask,
  onApplyToAll,
  disabled = false,
}: EditFileDialogProps) {
  // Local state for output filename
  const [fileName, setFileName] = useState(task.outputFileName);
  const [segment, setSegment] = useState<TimeSegment | null>(task.segment);

  // Reset local state when task changes
  useEffect(() => {
    setFileName(task.outputFileName);
    setSegment(task.segment);
  }, [task]);

  const handleApply = () => {
    onUpdateTask({
      outputFileName: fileName.trim() || task.outputFileName,
      segment,
    });
    onClose();
  };

  const handleApplyToAll = () => {
    onApplyToAll(segment);
    onUpdateTask({
      outputFileName: fileName.trim() || task.outputFileName,
    });
    onClose();
  };

  const handleFileNameChange = (value: string) => {
    // Only allow valid filename characters
    const sanitized = value.replace(/[<>:"/\\|?*]/g, "");
    setFileName(sanitized);
  };

  const footer: ModalProps["footer"] = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="edit-file-btn-secondary"
        disabled={disabled}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleApplyToAll}
        className="edit-file-btn-tertiary"
        disabled={disabled}
      >
        Apply to All
      </button>
      <button
        type="button"
        onClick={handleApply}
        className="edit-file-btn-primary"
        disabled={disabled}
      >
        Apply
      </button>
    </>
  );

  const duration = metadata?.duration_sec ?? 0;
  const segmentDuration = getSegmentDuration(segment, duration);
  const totalSize = estimatedSize;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit File"
      size="medium"
      footer={footer}
    >
      <div className="edit-file-dialog-content">
        {/* File Info */}
        <section className="edit-file-section">
          <div className="edit-file-info">
            <span className="edit-file-info-label">File:</span>
            <span className="edit-file-info-value" title={task.inputPath}>
              {task.originalFileName}
            </span>
          </div>
          {metadata && (
            <div className="edit-file-metadata">
              <span className="edit-file-metadata-item">
                {metadata.video.width}x{metadata.video.height}
              </span>
              <span className="edit-file-metadata-item">
                {metadata.video.framerate} fps
              </span>
              <span className="edit-file-metadata-item">
                {secondsToTimecode(metadata.duration_sec)}
              </span>
            </div>
          )}
        </section>

        {/* Output Filename */}
        <section className="edit-file-section">
          <label className="edit-file-label">Output Filename</label>
          <div className="edit-file-filename-input">
            <input
              type="text"
              className="edit-file-input"
              value={fileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
              disabled={disabled}
              placeholder="Enter filename"
            />
            <span className="edit-file-extension">
              {task.suffix}
              {task.extension}
            </span>
          </div>
        </section>

        {/* Time Range */}
        {metadata && (
          <section className="edit-file-section">
            <label className="edit-file-label">Time Range</label>
            <TimeRangeInput
              duration={duration}
              segment={segment}
              onChange={setSegment}
              disabled={disabled}
            />
          </section>
        )}

        {/* Preset Info */}
        <section className="edit-file-section">
          <div className="edit-file-preset-info">
            <span className="edit-file-preset-label">Output Format:</span>
            <span className="edit-file-preset-value">{PRESET_DISPLAY_NAMES[preset]}</span>
          </div>
        </section>

        {/* Estimated Size */}
        <section className="edit-file-section">
          <div className="edit-file-size-info">
            <span className="edit-file-size-label">Estimated Size:</span>
            <span className="edit-file-size-value">{totalSize}</span>
          </div>
          {segment && metadata && (
            <div className="edit-file-segment-info">
              Segment duration: {secondsToTimecode(segmentDuration)}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
