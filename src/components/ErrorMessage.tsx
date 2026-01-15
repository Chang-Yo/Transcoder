
interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="error-message">
      <p>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="error-dismiss">
          Dismiss
        </button>
      )}
    </div>
  );
}
