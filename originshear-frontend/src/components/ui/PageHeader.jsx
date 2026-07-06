import BilingualText from "./BilingualText";

export default function PageHeader({ title, subtitle, en, st, action = null, className = "" }) {
  return (
    <div className={`flex justify-between items-start mb-stack-lg ${className}`}>
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">
          {en ? <BilingualText en={en} st={st} size="headline-md" /> : title}
        </h1>
        {subtitle && <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
