import { useNavigate } from "react-router-dom";
import { useRegisterLot } from "./RegisterLotContext";
import AppLayout from "../../layouts/AppLayout";

export default function RegisterLotStep1() {
  const navigate = useNavigate();
  const { form, update, GPS_ZONES } = useRegisterLot();

  const canContinue = Number(form.weightKg) > 0 && Number(form.weightKg) <= 4000;

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-6">
        <h1 className="text-headline-md font-bold mb-4">
          Register Harvest Lot / Ngodisa Sela
        </h1>

        <Stepper current={1} />

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 mt-4 space-y-5">
          <Field label="Fibre Type / Mofuta oa Boya">
            <div className="grid grid-cols-2 gap-3">
              <ToggleOption
                active={form.fibreType === 0}
                onClick={() => update({ fibreType: 0 })}
                label="Wool (Boya ba Nku)"
              />
              <ToggleOption
                active={form.fibreType === 1}
                onClick={() => update({ fibreType: 1 })}
                label="Mohair (Boya ba Poli)"
              />
            </div>
          </Field>

          <Field label="Grade / Kereiti">
            <div className="flex flex-wrap gap-3">
              <PillOption active={form.grade === 0} onClick={() => update({ grade: 0 })} label="A (Premium)" />
              <PillOption active={form.grade === 1} onClick={() => update({ grade: 1 })} label="B (Standard)" />
              <PillOption active={form.grade === 2} onClick={() => update({ grade: 2 })} label="C (Commercial)" />
            </div>
          </Field>

          <Field label="Total Weight / Boima bo Kakaretso">
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.weightKg}
                onChange={(e) => update({ weightKg: e.target.value })}
                placeholder="0.00"
                className="w-full h-14 rounded-lg border border-outline-variant bg-surface-container px-4 pr-12 text-headline-sm font-bold focus:border-primary focus:border-2 outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold">
                kg
              </span>
            </div>
          </Field>

          <Field label="GPS Zone / Sebaka">
            <select
              value={form.gpsZone}
              onChange={(e) => update({ gpsZone: e.target.value })}
              className="w-full h-14 rounded-lg border border-outline-variant bg-surface-container px-4 text-body-md font-semibold focus:border-primary focus:border-2 outline-none appearance-none"
            >
              {GPS_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Season / Nako">
            <input
              type="text"
              value={form.seasonYear}
              onChange={(e) => update({ seasonYear: e.target.value })}
              className="w-full h-14 rounded-lg border border-outline-variant bg-surface-container px-4 text-body-md font-semibold focus:border-primary focus:border-2 outline-none"
            />
          </Field>
        </div>

        <button
          disabled={!canContinue}
          onClick={() => navigate("/farmer/register/review")}
          className="w-full h-14 rounded-lg bg-primary text-on-primary font-semibold mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Review Details / Hlahloba Boitsebiso
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-center text-body-sm text-on-surface-variant mt-3">
          Blockchain verification will be initiated upon submission.
        </p>
      </div>
    </AppLayout>
  );
}

export function Stepper({ current }) {
  const steps = ["Details", "Logistics", "Confirm"];
  return (
    <div>
      <div className="flex gap-1.5 mb-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${i < current ? "bg-primary" : "bg-surface-container-highest"}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-label-sm">
        {steps.map((s, i) => (
          <span key={s} className={i + 1 === current ? "text-primary font-bold" : "text-on-surface-variant"}>
            Step {i + 1}: {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-body-sm font-semibold text-on-surface mb-2">{label}</label>
      {children}
    </div>
  );
}

function ToggleOption({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-14 rounded-lg px-3 font-semibold text-body-sm transition-colors ${
        active ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
      }`}
    >
      {label}
    </button>
  );
}

function PillOption({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 px-5 rounded-full font-semibold text-body-sm border transition-colors ${
        active
          ? "border-primary text-primary bg-primary-container/20"
          : "border-outline-variant text-on-surface-variant"
      }`}
    >
      {label}
    </button>
  );
}
