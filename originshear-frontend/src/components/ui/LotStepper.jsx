/**
 * 3-step progress bar from Stitch register_lot_step_1.
 */
export default function LotStepper({ current }) {
  const steps = ["Details", "Logistics", "Confirm"];
  return (
    <div>
      <div className="flex gap-2 w-full mt-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${i < current ? "bg-primary" : "bg-surface-container-highest"}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`text-label-sm ${i + 1 === current ? "text-primary font-bold" : "text-on-surface-variant"}`}
          >
            Step {i + 1}: {s}
          </span>
        ))}
      </div>
    </div>
  );
}
