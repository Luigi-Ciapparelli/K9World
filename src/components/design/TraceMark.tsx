export function TraceMark({ className = '', label }: { className?: string; label?: string }) {
  return (
    <span className={`pc-trace ${className}`} aria-hidden={label ? undefined : true} aria-label={label}>
      <span className="pc-trace-dot" />
      <span className="pc-trace-line" />
      <span className="pc-trace-dot" />
    </span>
  );
}
