import { useState } from "react";
import type { OutputPreset } from "../types";
import { PRESET_INFO } from "../presetInfo";
import { PRESET_DISPLAY_NAMES } from "../types";
import "./PresetDropdown.css";

export interface PresetDropdownProps {
  currentPreset: OutputPreset | null;  // null = using global
  globalPreset: OutputPreset;
  onPresetChange: (preset: OutputPreset | null) => void;
  disabled?: boolean;
}

const PRESET_ORDER: OutputPreset[] = [
  "ProRes422",
  "ProRes422LT",
  "ProRes422Proxy",
  "DnxHRHQX",
  "H264Crf18",
];

export function PresetDropdown({
  currentPreset,
  globalPreset,
  onPresetChange,
  disabled = false,
}: PresetDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const effectivePreset = currentPreset ?? globalPreset;
  const isUsingGlobal = currentPreset === null;

  const handleSelectPreset = (preset: OutputPreset) => {
    onPresetChange(preset);
    setIsOpen(false);
  };

  const handleUseGlobal = () => {
    onPresetChange(null);  // null means use global
    setIsOpen(false);
  };

  return (
    <div className={`preset-dropdown ${disabled ? "disabled" : ""}`}>
      <div className="preset-dropdown-header">
        <button
          type="button"
          className="preset-dropdown-trigger"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className="preset-dropdown-label">
            {isUsingGlobal ? (
              <>
                <span className="preset-global-badge">Global</span>
                {PRESET_DISPLAY_NAMES[effectivePreset]}
              </>
            ) : (
              PRESET_DISPLAY_NAMES[effectivePreset]
            )}
          </span>
          <span className={`preset-dropdown-arrow ${isOpen ? "open" : ""}`}>▼</span>
        </button>
        {!isUsingGlobal && (
          <button
            type="button"
            className="preset-use-global-btn"
            onClick={handleUseGlobal}
            disabled={disabled}
            title="Use global preset"
          >
            Use Global
          </button>
        )}
      </div>

      {isOpen && (
        <div className="preset-dropdown-menu">
          {PRESET_ORDER.map((preset) => {
            const info = PRESET_INFO[preset];
            const isSelected = effectivePreset === preset;

            return (
              <button
                key={preset}
                type="button"
                className={`preset-dropdown-item ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelectPreset(preset)}
              >
                <div className="preset-item-main">
                  <span className="preset-item-name">{PRESET_DISPLAY_NAMES[preset]}</span>
                  {isSelected && <span className="preset-item-check">✓</span>}
                </div>
                <div className="preset-item-desc">{info.description}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
