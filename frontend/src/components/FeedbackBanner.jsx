export default function FeedbackBanner({ type = 'info', message, actionLabel, onAction }) {
  if (!message) return null;

  return (
    <div className={`feedback feedback-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      {onAction && (
        <button className="link-button" type="button" onClick={onAction}>
          {actionLabel || 'Retry'}
        </button>
      )}
    </div>
  );
}
