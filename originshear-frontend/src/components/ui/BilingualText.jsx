/**
 * Renders the "Label (English) / Label (Sesotho)" pattern used throughout
 * ORIGINSHEAR per the design system's Bilingual Labels component spec.
 * In tight horizontal spaces, pass `stacked` to switch to a vertical
 * layout with English in semibold and Sesotho in a lighter weight below.
 */
export default function BilingualText({ en, st, stacked = false, className = "", size = "body-md" }) {
  if (stacked) {
    return (
      <span className={`flex flex-col ${className}`}>
        <span className={`text-${size} font-semibold text-on-surface`}>{en}</span>
        {st && <span className="text-label-sm text-on-surface-variant">{st}</span>}
      </span>
    );
  }
  return (
    <span className={`text-${size} text-on-surface ${className}`}>
      {en}
      {st && <span className="text-on-surface-variant"> / {st}</span>}
    </span>
  );
}
