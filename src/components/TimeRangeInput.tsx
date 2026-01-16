import type { TimeSegment } from "../types";
import { secondsToTimecode, timecodeToSeconds, getSegmentDuration } from "../types";

interface TimeRangeInputProps {
  duration: number;  // Total video duration in seconds
  segment: TimeSegment | null;
  onChange: (segment: TimeSegment | null) => void;
  disabled?: boolean;
}

export function TimeRangeInput({ duration, segment, onChange, disabled }: TimeRangeInputProps) {
  const isEnabled = segment !== null;

  const handleToggle = (checked: boolean) => {
    if (checked) {
      // Enable with default segment (first 30 seconds or full duration if shorter)
      onChange({
        start_sec: 0,
        end_sec: Math.min(30, duration),
      });
    } else {
      onChange(null);
    }
  };

  const handleSliderChange = (values: [number, number]) => {
    if (!isEnabled) return;
    const [start, end] = values;
    onChange({
      start_sec: start,
      end_sec: end < duration ? end : null,
    });
  };

  const handleStartTimeChange = (timecode: string) => {
    if (!isEnabled) return;
    const seconds = timecodeToSeconds(timecode);
    if (seconds === null || seconds < 0 || seconds >= duration) return;

    const endSec = segment!.end_sec;
    if (endSec !== null && seconds >= endSec) return;

    onChange({ ...segment!, start_sec: seconds });
  };

  const handleEndTimeChange = (timecode: string) => {
    if (!isEnabled) return;
    const seconds = timecodeToSeconds(timecode);
    if (seconds === null || seconds < 0) return;

    const startSec = segment!.start_sec;
    if (seconds <= startSec) return;

    // If input exceeds duration, set to null (end of video)
    onChange({
      ...segment!,
      end_sec: seconds >= duration ? null : seconds,
    });
  };

  const handleEndToVideoEnd = () => {
    if (!isEnabled) return;
    onChange({ ...segment!, end_sec: null });
  };

  // Slider values (0-100 scale for visual representation)
  const startPercent = isEnabled ? (segment.start_sec / duration) * 100 : 0;
  const endPercent = isEnabled ? ((segment.end_sec ?? duration) / duration) * 100 : 100;

  // Segment duration for display
  const segmentDuration = isEnabled ? getSegmentDuration(segment, duration) : duration;
  const durationDisplay = secondsToTimecode(segmentDuration);

  return (
    <div className={`time-range-input ${disabled ? "disabled" : ""}`}>
      <label className="time-range-toggle">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => handleToggle(e.target.checked)}
          disabled={disabled}
        />
        <span>Trim video segment</span>
      </label>

      {isEnabled && (
        <>
          <div className="time-range-slider-container">
            <div className="time-range-slider">
              <div className="slider-track" />
              <div
                className="slider-fill"
                style={{
                  left: `${startPercent}%`,
                  width: `${endPercent - startPercent}%`,
                }}
              />
              <input
                type="range"
                min={0}
                max={duration}
                step={1}
                value={segment.start_sec}
                onChange={(e) => {
                  const newStart = parseFloat(e.target.value);
                  const currentEnd = segment.end_sec ?? duration;
                  if (newStart < currentEnd - 1) {
                    handleSliderChange([newStart, currentEnd]);
                  }
                }}
                disabled={disabled}
                className="slider-input slider-start"
                style={{ left: `${startPercent}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration}
                step={1}
                value={segment.end_sec ?? duration}
                onChange={(e) => {
                  const newEnd = parseFloat(e.target.value);
                  if (newEnd > segment.start_sec + 1) {
                    handleSliderChange([segment.start_sec, newEnd]);
                  }
                }}
                disabled={disabled}
                className="slider-input slider-end"
                style={{ left: `${endPercent}%` }}
              />
            </div>
          </div>

          <div className="time-inputs">
            <div className="time-input">
              <label>Start:</label>
              <input
                type="text"
                value={secondsToTimecode(segment.start_sec)}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                disabled={disabled}
                placeholder="00:00:00"
                maxLength={8}
              />
            </div>
            <div className="time-input">
              <label>End:</label>
              <input
                type="text"
                value={segment.end_sec !== null ? secondsToTimecode(segment.end_sec) : "End"}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                disabled={disabled}
                placeholder="00:00:00"
                maxLength={8}
              />
              {segment.end_sec !== null && segment.end_sec < duration && (
                <button
                  className="to-end-btn"
                  onClick={handleEndToVideoEnd}
                  disabled={disabled}
                  title="Set to video end"
                >
                  →
                </button>
              )}
            </div>
          </div>

          <div className="segment-duration">
            Segment length: {durationDisplay}
          </div>
        </>
      )}
    </div>
  );
}
