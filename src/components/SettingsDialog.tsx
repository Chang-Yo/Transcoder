import { Modal, type ModalProps } from "./ui/Modal";
import type { AppSettings } from "../types";
import { PRESET_DISPLAY_NAMES, PRESET_INFO } from "../presetInfo";
import type { OutputPreset } from "../types";
import "./SettingsDialog.css";

export interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function SettingsDialog({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SettingsDialogProps) {
  const handleSave = () => {
    onSettingsChange(settings);
    onClose();
  };

  const handleChange = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const footer: ModalProps["footer"] = (
    <>
      <button type="button" onClick={onClose} className="settings-btn-secondary">
        Cancel
      </button>
      <button type="button" onClick={handleSave} className="settings-btn-primary">
        Save
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      size="medium"
      footer={footer}
    >
      <div className="settings-dialog-content">
        {/* Default Output Format */}
        <section className="settings-section">
          <label className="settings-label">Default Output Format</label>
          <select
            className="settings-select"
            value={settings.defaultPreset}
            onChange={(e) => handleChange("defaultPreset", e.target.value as OutputPreset)}
          >
            {(Object.keys(PRESET_INFO) as OutputPreset[]).map((preset) => (
              <option key={preset} value={preset}>
                {PRESET_DISPLAY_NAMES[preset]}
              </option>
            ))}
          </select>
          <p className="settings-hint">
            The default format for new files. Can be changed per file.
          </p>
        </section>

        {/* Default Output Directory */}
        <section className="settings-section">
          <label className="settings-label">Default Output Directory</label>
          <input
            type="text"
            className="settings-input"
            value={settings.defaultOutputDir}
            onChange={(e) => handleChange("defaultOutputDir", e.target.value)}
            placeholder="Leave empty to use input file directory"
          />
          <p className="settings-hint">
            Files will be saved to this folder by default.
          </p>
        </section>

        {/* Remember Output Directory */}
        <section className="settings-section">
          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={settings.rememberOutputDir}
              onChange={(e) => handleChange("rememberOutputDir", e.target.checked)}
            />
            <span>Remember last used output directory</span>
          </label>
          <p className="settings-hint">
            When enabled, the app will remember the output directory from the last session.
          </p>
        </section>

        {/* Default Segment Length */}
        <section className="settings-section">
          <label className="settings-label">Default Segment Length (seconds)</label>
          <input
            type="number"
            className="settings-input"
            value={settings.defaultSegmentLength}
            onChange={(e) => handleChange("defaultSegmentLength", parseInt(e.target.value) || 30)}
            min="1"
            max="3600"
            step="1"
          />
          <p className="settings-hint">
            When trimming is enabled, the slider will default to this duration.
          </p>
        </section>
      </div>
    </Modal>
  );
}
