import "./ErrorMessage.css";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="error-toast">
      <div className="error-toast-content">
        <span className="error-toast-icon">⚠</span>
        <p className="error-toast-message">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="error-toast-dismiss"
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
