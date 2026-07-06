/**
 * Shared form controls matching Stitch mobile register-lot screens.
 */
export function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-label-lg text-on-surface mb-stack-sm">{label}</label>
      {children}
    </div>
  );
}

export function FibreToggle({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-xl">
      <ToggleOption active={value === 0} onClick={() => onChange(0)} label="Wool (Boya ba Nku)" />
      <ToggleOption active={value === 1} onClick={() => onChange(1)} label="Mohair (Boya ba Poli)" />
    </div>
  );
}

export function GradePills({ value, onChange }) {
  const grades = [
    { v: 0, label: "A (Premium)" },
    { v: 1, label: "B (Standard)" },
    { v: 2, label: "C (Commercial)" },
  ];
  return (
    <div className="flex flex-wrap gap-stack-sm">
      {grades.map((g) => (
        <PillOption key={g.v} active={value === g.v} onClick={() => onChange(g.v)} label={g.label} />
      ))}
    </div>
  );
}

export function ToggleOption({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 rounded-lg text-label-lg transition-all ${
        active
          ? "bg-primary text-on-primary shadow-sm"
          : "text-on-surface-variant hover:bg-surface-container-highest"
      }`}
    >
      {label}
    </button>
  );
}

export function PillOption({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-2 rounded-full border text-label-lg transition-colors ${
        active
          ? "border-primary bg-primary-container text-on-primary-container"
          : "border-outline-variant text-on-surface-variant hover:border-primary"
      }`}
    >
      {label}
    </button>
  );
}

export const inputClassName =
  "w-full bg-surface-container-low border border-outline-variant rounded-lg h-touch-target-min px-4 text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all";

export const selectClassName = `${inputClassName} appearance-none font-semibold`;

export const textareaClassName =
  "w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none";
