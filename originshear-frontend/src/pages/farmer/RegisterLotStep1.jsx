import { useNavigate } from "react-router-dom";
import { useRegisterLot } from "./RegisterLotContext";
import AppLayout from "../../layouts/AppLayout";
import LotStepper from "../../components/ui/LotStepper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import {
  FormField,
  FibreToggle,
  GradePills,
  inputClassName,
  selectClassName,
} from "../../components/ui/FormField";

export default function RegisterLotStep1() {
  const navigate = useNavigate();
  const { form, update, GPS_ZONES } = useRegisterLot();

  const canContinue = Number(form.weightKg) > 0 && Number(form.weightKg) <= 4000;

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-6 max-w-[1024px] mx-auto">
        <section className="mb-stack-lg">
          <h1 className="text-headline-md font-bold text-on-surface mb-stack-sm">
            Register Harvest Lot / Ngodisa Sela
          </h1>
          <LotStepper current={1} />
        </section>

        <Card className="space-y-stack-lg">
          <FormField label="Fibre Type / Mofuta oa Boya">
            <FibreToggle value={form.fibreType} onChange={(v) => update({ fibreType: v })} />
          </FormField>

          <FormField label="Grade / Kereiti">
            <GradePills value={form.grade} onChange={(v) => update({ grade: v })} />
          </FormField>

          <FormField label="Total Weight / Boima bo Kakaretso">
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.weightKg}
                onChange={(e) => update({ weightKg: e.target.value })}
                placeholder="0.00"
                className={`${inputClassName} text-headline-md font-bold pr-12`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-headline-sm text-on-surface-variant">
                kg
              </span>
            </div>
          </FormField>

          <div className="grid grid-cols-1 gap-stack-md">
            <FormField label="GPS Zone / Sebaka">
              <select
                value={form.gpsZone}
                onChange={(e) => update({ gpsZone: e.target.value })}
                className={selectClassName}
              >
                {GPS_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Season / Nako">
              <input
                type="text"
                value={form.seasonYear}
                onChange={(e) => update({ seasonYear: e.target.value })}
                className={`${inputClassName} font-bold text-on-surface-variant`}
              />
            </FormField>
          </div>
        </Card>

        <div className="mt-stack-lg">
          <Button
            disabled={!canContinue}
            onClick={() => navigate("/farmer/register/logistics")}
            size="lg"
            icon={<Icon name="chevron_right" />}
            iconPosition="right"
          >
            Review Details / Hlahloba Boitsebiso
          </Button>
          <p className="text-center text-body-sm text-on-surface-variant mt-4 px-4">
            Blockchain verification will be initiated upon submission.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}