import type { OutputPreset } from "../types";
import { PRESET_INFO, PRESET_PARAMETERS } from "../presetInfo";
import { pluralize } from "../utils/text";
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
  completedCount: number;
  onClearCompleted?: () => void;
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
  completedCount,
  onClearCompleted,
}: SidebarPanelProps) {
  const params = PRESET_PARAMETERS[selectedPreset];

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

      {/* Preset Details */}
      <section className="sidebar-section">
        <h3 className="sidebar-section-title">Preset Details</h3>
        <div className="preset-info">
          <div className="preset-info-row">
            <span className="preset-info-label">Codec</span>
            <span className="preset-info-value">{params.codec}</span>
          </div>
          <div className="preset-info-row">
            <span className="preset-info-label">Audio</span>
            <span className="preset-info-value">{params.audio}</span>
          </div>
          <div className="preset-info-row">
            <span className="preset-info-label">Color</span>
            <span className="preset-info-value">{params.colorDepth}</span>
          </div>
          <div className="preset-info-row">
            <span className="preset-info-label">Chroma</span>
            <span className="preset-info-value">{params.chroma}</span>
          </div>
          <div className="preset-info-row">
            <span className="preset-info-label">Bitrate</span>
            <span className="preset-info-value">{params.bitrate}</span>
          </div>
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
        {completedCount > 0 && (
          <button
            className="sidebar-button sidebar-button-tertiary"
            onClick={onClearCompleted}
            disabled={isTranscoding}
          >
            Clear Completed ({completedCount})
          </button>
        )}
      </section>

      {/* File Count Indicator */}
      <section className="sidebar-section">
        <div className="sidebar-file-count">
          <span className="sidebar-file-count-number">{fileCount}</span>
          <span className="sidebar-file-count-label">
            {pluralize(fileCount, "file")} in queue
          </span>
        </div>
      </section>
    </aside>
  );
}
