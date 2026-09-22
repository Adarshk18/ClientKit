export function Spinner({
  className = "h-4 w-4",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center justify-center ${className}`}
    >
      <span className="ck-spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
