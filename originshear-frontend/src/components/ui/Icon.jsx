/**
 * Google Material Symbols wrapper — matches Stitch export iconography.
 */
export default function Icon({ name, filled = false, className = "", size = 24 }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        fontSize: typeof size === "number" ? `${size}px` : undefined,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
