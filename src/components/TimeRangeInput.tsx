import { useState, useCallback, useRef, useEffect } from "react";
import type { TimeSegment } from "../types";
import { secondsToTimecode, timecodeToSeconds, getSegmentDuration } from "../types";
import "./TimeRangeInput.css";

// Constants for time range behavior
const DEFAULT_SEGMENT_DURATION = 30; // Default segment length in seconds when enabled
const MIN_SEGMENT_GAP = 1; // Minimum seconds between start and end
const THUMB_BUFFER_PERCENT = 4; // Buffer percent for slider thumb visibility

interface TimeRangeInputProps {
  duration: number;  // Total video duration in seconds
  segment: TimeSegment | null;
  onChange: (segment: TimeSegment | null) => void;
  disabled?: boolean;
}

// Validation result for timecode input
interface ValidationResult {
  isValid: boolean;
  seconds: number | null;
}

/**
 * Validate a timecode input for start time
 * Returns valid seconds or null if invalid
 */
function validateStartTimeInput(
  timecode: string,
  currentSegment: TimeSegment,
  duration: number
): ValidationResult {
  const seconds = timecodeToSeconds(timecode);

  // Invalid timecode format
  if (seconds === null) {
    return { isValid: false, seconds: null };
  }

  // Out of bounds
  if (seconds < 0 || seconds >= duration) {
    return { isValid: false, seconds: null };
  }

  // Must be before end time
  const endSec = currentSegment.end_sec;
  if (endSec !== null && seconds >= endSec) {
    return { isValid: false, seconds: null };
  }

  return { isValid: true, seconds };
}

/**
 * Validate a timecode input for end time
 * Returns valid seconds, null (for "End"), or null if invalid
 */
function validateEndTimeInput(
  timecode: string,
  currentSegment: TimeSegment,
  duration: number
): ValidationResult {
  // Special case: "end" means end of video
  if (timecode.toLowerCase() === "end") {
    return { isValid: true, seconds: null };
  }

  const seconds = timecodeToSeconds(timecode);

  // Invalid timecode format
  if (seconds === null || seconds < 0) {
    return { isValid: false, seconds: null };
  }

  // Must be after start time
  const startSec = currentSegment.start_sec;
  if (seconds <= startSec) {
    return { isValid: false, seconds: null };
  }

  // If exceeds duration, treat as "end of video"
  if (seconds >= duration) {
    return { isValid: true, seconds: null };
  }

  return { isValid: true, seconds };
}

export function TimeRangeInput({ duration, segment, onChange, disabled }: TimeRangeInputProps) {
  const isEnabled = segment !== null;

  // Local state for time inputs to prevent premature updates during editing
  const [startTimeInput, setStartTimeInput] = useState("");
  const [endTimeInput, setEndTimeInput] = useState("");

  // Track which input is focused
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when segment changes externally
  useEffect(() => {
    if (isEnabled) {
      setStartTimeInput(secondsToTimecode(segment.start_sec));
      setEndTimeInput(
        segment.end_sec !== null ? secondsToTimecode(segment.end_sec) : "End"
      );
    } else {
      setStartTimeInput("");
      setEndTimeInput("");
    }
  }, [isEnabled, segment]);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      // Enable with default segment (first N seconds or full duration if shorter)
      onChange({
        start_sec: 0,
        end_sec: Math.min(DEFAULT_SEGMENT_DURATION, duration),
      });
    } else {
      onChange(null);
    }
  };

  const handleSliderChange = useCallback((values: [number, number]) => {
    if (!isEnabled) return;
    const [start, end] = values;
    const newSegment = {
      start_sec: start,
      end_sec: end < duration ? end : null,
    };
    onChange(newSegment);
    // Update local input states
    setStartTimeInput(secondsToTimecode(start));
    setEndTimeInput(end < duration ? secondsToTimecode(end) : "End");
  }, [duration, isEnabled, onChange]);

  const handleStartTimeChange = (timecode: string) => {
    setStartTimeInput(timecode);
  };

  const handleStartTimeBlur = () => {
    if (!segment) return;
    const result = validateStartTimeInput(startTimeInput, segment, duration);
    if (!result.isValid) {
      // Revert to current segment value
      setStartTimeInput(secondsToTimecode(segment.start_sec));
      return;
    }

    onChange({ ...segment, start_sec: result.seconds! });
  };

  const handleStartTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleStartTimeBlur();
      startInputRef.current?.blur();
    }
  };

  const handleEndTimeChange = (timecode: string) => {
    setEndTimeInput(timecode);
  };

  const handleEndTimeBlur = () => {
    if (!segment) return;
    const result = validateEndTimeInput(endTimeInput, segment, duration);
    if (!result.isValid) {
      // Revert to current segment value
      setEndTimeInput(
        segment.end_sec !== null ? secondsToTimecode(segment.end_sec) : "End"
      );
      return;
    }

    onChange({ ...segment, end_sec: result.seconds });
  };

  const handleEndTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleEndTimeBlur();
      endInputRef.current?.blur();
    }
  };

  const handleEndToVideoEnd = () => {
    if (!isEnabled || !segment) return;
    onChange({ ...segment, end_sec: null });
  };

  // Slider values (0-100 scale for visual representation)
  const startPercent = isEnabled && segment ? (segment.start_sec / duration) * 100 : 0;
  const endPercent = isEnabled && segment ? ((segment.end_sec ?? duration) / duration) * 100 : 100;

  // Clip paths to make each slider only receive events on its thumb area
  // This prevents the sliders from interfering with each other
  const startClipPath = `inset(0 0 0 ${Math.max(0, startPercent - THUMB_BUFFER_PERCENT)}%)`;
  const endClipPath = `inset(0 ${Math.max(0, 100 - endPercent - THUMB_BUFFER_PERCENT)}% 0 0)`;

  // Segment duration for display
  const segmentDuration = isEnabled && segment ? getSegmentDuration(segment, duration) : duration;
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
        <span>Enable time range</span>
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
                step={0.1}
                value={segment.start_sec}
                onChange={(e) => {
                  const newStart = parseFloat(e.target.value);
                  const currentEnd = segment.end_sec ?? duration;
                  if (newStart < currentEnd - MIN_SEGMENT_GAP) {
                    handleSliderChange([newStart, currentEnd]);
                  }
                }}
                disabled={disabled}
                className="slider-input slider-start"
                style={{ clipPath: startClipPath, WebkitClipPath: startClipPath }}
              />
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={segment.end_sec ?? duration}
                onChange={(e) => {
                  const newEnd = parseFloat(e.target.value);
                  if (newEnd > segment.start_sec + MIN_SEGMENT_GAP) {
                    handleSliderChange([segment.start_sec, newEnd]);
                  }
                }}
                disabled={disabled}
                className="slider-input slider-end"
                style={{ clipPath: endClipPath, WebkitClipPath: endClipPath }}
              />
            </div>
          </div>

          <div className="time-inputs">
            <div className="time-input">
              <label>Start:</label>
              <input
                ref={startInputRef}
                type="text"
                value={startTimeInput}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                onBlur={handleStartTimeBlur}
                onKeyDown={handleStartTimeKeyDown}
                disabled={disabled}
                placeholder="00:00:00"
                maxLength={8}
              />
            </div>
            <div className="time-input">
              <label>End:</label>
              <input
                ref={endInputRef}
                type="text"
                value={endTimeInput}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                onBlur={handleEndTimeBlur}
                onKeyDown={handleEndTimeKeyDown}
                disabled={disabled}
                placeholder="00:00:00 or End"
                maxLength={8}
              />
              {segment.end_sec !== null && segment.end_sec < duration && (
                <button
                  type="button"
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
            Time range length: {durationDisplay}
          </div>
        </>
      )}
    </div>
  );
}
