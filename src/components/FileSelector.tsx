import { open } from "@tauri-apps/api/dialog";

interface FileSelectorProps {
  onFilesSelect: (paths: string[]) => void;
  selectedFiles: string[];
  disabled: boolean;
}

export function FileSelector({ onFilesSelect, selectedFiles, disabled }: FileSelectorProps) {
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const paths = files
        .map((file) => (file as any).path)
        .filter((path) => path);
      if (paths.length > 0) onFilesSelect(paths);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleBrowse = async () => {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Video",
          extensions: ["mp4", "mkv", "avi", "mov", "m4v", "webm", "flv", "wmv"],
        },
      ],
    });

    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      onFilesSelect(paths);
    }
  };

  return (
    <div
      className={`file-selector ${disabled ? "disabled" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="drop-zone">
        <p>
          {selectedFiles.length === 0
            ? "Drag and drop video files here"
            : "Drag and drop more files or"}
        </p>
        <p className="or">or</p>
        <button onClick={handleBrowse} disabled={disabled}>
          Browse Files
        </button>
      </div>
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <strong>Selected {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}:</strong>
          <ul className="file-list">
            {selectedFiles.map((file, index) => {
              const fileName = file.split(/[/\\]/).pop() || file;
              return (
                <li key={index} className="file-list-item">
                  <span className="file-name" title={file}>
                    📁 {fileName}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
