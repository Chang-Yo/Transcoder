import "./StatusBar.css";

export interface StatusBarProps {
  completedCount: number;
  totalCount: number;
  failedCount: number;
  estimatedTime?: string;
}

export function StatusBar({
  completedCount,
  totalCount,
  failedCount,
  estimatedTime,
}: StatusBarProps) {
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const remainingCount = totalCount - completedCount - failedCount;

  return (
    <div className="status-bar">
      <div className="status-bar-content">
        <div className="status-bar-info">
          <span className="status-bar-text">
            Overall: {completedCount}/{totalCount} completed
            {remainingCount > 0 && ` · ${remainingCount} remaining`}
            {failedCount > 0 && ` · ${failedCount} failed`}
          </span>
          {estimatedTime && (
            <span className="status-bar-time">Est. time: {estimatedTime}</span>
          )}
        </div>
        <div className="status-bar-progress-container">
          <div className="status-bar-progress-bg">
            <div
              className="status-bar-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="status-bar-percent">{progressPercent.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
