import type { TranscodeProgress } from "../types";

interface ProgressDisplayProps {
  progress: TranscodeProgress;
}

export function ProgressDisplay({ progress }: ProgressDisplayProps) {
  return (
    <div className="progress-container">
      <div className="progress-bar-bg">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress.progress_percent}%` }}
        />
      </div>
      <div className="progress-info">
        <span>{progress.progress_percent.toFixed(1)}%</span>
        {progress.fps !== undefined && <span> | {progress.fps.toFixed(1)} fps</span>}
        {progress.time_elapsed && <span> | Time: {progress.time_elapsed}</span>}
      </div>
    </div>
  );
}
