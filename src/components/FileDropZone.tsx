import { useState } from "react";
import "./FileDropZone.css";

export interface FileDropZoneProps {
  onFilesDrop: (paths: string[]) => void;
  onAddFiles?: () => void;
  disabled?: boolean;
}

export function FileDropZone({ onFilesDrop, onAddFiles, disabled = false }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    // Only set to false if we're leaving the drop zone itself
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const paths = e.dataTransfer.files as unknown as { path: string }[];
    const filePaths = Array.from(paths)
      .map((f) => f.path)
      .filter((p) => p);

    if (filePaths.length > 0) {
      onFilesDrop(filePaths);
    }
  };

  return (
    <div
      className={`file-drop-zone ${isDragging ? "file-drop-zone-dragging" : ""} ${
        disabled ? "file-drop-zone-disabled" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="file-drop-zone-content">
        <div className="file-drop-zone-icon">📁</div>
        <p className="file-drop-zone-text">
          {disabled ? "Add files disabled" : "Drag and drop video files or folders here"}
        </p>
        {onAddFiles && !disabled && (
          <button
            className="file-drop-zone-button"
            onClick={onAddFiles}
            type="button"
          >
            Add Files
          </button>
        )}
      </div>
    </div>
  );
}
