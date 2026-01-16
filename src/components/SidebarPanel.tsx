import type { OutputPreset } from "../types";
import { PRESET_INFO } from "../presetInfo";
import "./SidebarPanel.css";

export interface SidebarPanelProps {
  selectedPreset: OutputPreset;
  onPresetChange: (preset: OutputPreset) => void;
  outputDir: string;
  onOutputDirChange: (dir: string) => void;
  estimatedSize: string;
  fileCount: number;
  onAddFiles: () => void;
  onStartTranscode: () => void;
  isTranscoding: boolean;
  canStart: boolean;
}

export function SidebarPanel({
  selectedPreset,
  onPresetChange,
  outputDir,
  onOutputDirChange,
  estimatedSize,
  fileCount,
  onAddFiles,
  onStartTranscode,
  isTranscoding,
  canStart,
}: SidebarPanelProps) {
  return (
    <aside className="sidebar-panel">
      {/* Preset Selection */}
      <section className="sidebar-section">
        <h3 className="sidebar-section-title">Output Format</h3>
        <div className="preset-grid">
          {(Object.keys(PRESET_INFO) as OutputPreset[]).map((preset) => (
            <label
              key={preset}
              className={`preset-card-compact ${selectedPreset === preset ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="preset"
                value={preset}
                checked={selectedPreset === preset}
                onChange={() => onPresetChange(preset)}
                disabled={isTranscoding}
              />
              <span className="preset-card-compact-content">
                <span className="preset-card-compact-name">
                  {PRESET_INFO[preset].name}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Output Directory */}
      <section className="sidebar-section">
        <label htmlFor="output-dir" className="sidebar-label">
          Output Directory
        </label>
        <input
          id="output-dir"
          type="text"
          className="sidebar-input"
          value={outputDir}
          onChange={(e) => onOutputDirChange(e.target.value)}
          disabled={isTranscoding}
          placeholder="Select output folder..."
        />
      </section>

      {/* Estimated Size */}
      <section className="sidebar-section">
        <div className="sidebar-estimate">
          <span className="sidebar-estimate-label">Est.</span>
          <span className="sidebar-estimate-value">{estimatedSize}</span>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="sidebar-section sidebar-section-spacer">
        <button
          className="sidebar-button sidebar-button-secondary"
          onClick={onAddFiles}
          disabled={isTranscoding}
        >
          + Add Files
        </button>
        <button
          className="sidebar-button sidebar-button-primary"
          onClick={onStartTranscode}
          disabled={isTranscoding || !canStart}
        >
          {isTranscoding ? "Transcoding..." : `Start (${fileCount})`}
        </button>
      </section>

      {/* File Count Indicator */}
      <section className="sidebar-section">
        <div className="sidebar-file-count">
          <span className="sidebar-file-count-number">{fileCount}</span>
          <span className="sidebar-file-count-label">
            {fileCount === 1 ? "file" : "files"} in queue
          </span>
        </div>
      </section>
    </aside>
  );
}
