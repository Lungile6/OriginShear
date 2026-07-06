import { useNavigate } from "react-router-dom";
import { useRegisterLot } from "./RegisterLotContext";
import AppLayout from "../../layouts/AppLayout";
import LotStepper from "../../components/ui/LotStepper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import {
  FormField,
  ToggleOption,
  inputClassName,
  selectClassName,
  textareaClassName,
} from "../../components/ui/FormField";

export default function RegisterLotStep2() {
  const navigate = useNavigate();
  const { form, update, STORAGE_OPTIONS } = useRegisterLot();

  return (
    <AppLayout role="FARMER" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-6 max-w-[1024px] mx-auto">
        <section className="mb-stack-lg">
          <h1 className="text-headline-md font-bold text-on-surface mb-stack-sm">
            Logistics / Litsamaiso
          </h1>
          <LotStepper current={2} />
        </section>

        <Card className="space-y-stack-lg">
          <FormField label="Storage Method / Mokhoa oa ho Boloka">
            <select
              value={form.storageMethod}
              onChange={(e) => update({ storageMethod: e.target.value })}
              className={selectClassName}
            >
              {STORAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Handling Notes / Tlhaloso ea ho Sireletsa">
            <textarea
              value={form.handlingNotes}
              onChange={(e) => update({ handlingNotes: e.target.value })}
              rows={3}
              placeholder="Optional notes on bale condition, moisture, or collection instructions"
              className={textareaClassName}
            />
          </FormField>

          <FormField label="Ready for Pickup / E Loketse ho Nkuoa">
            <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-xl">
              <ToggleOption
                active={form.readyForPickup}
                onClick={() => update({ readyForPickup: true })}
                label="Yes / Ee"
              />
              <ToggleOption
                active={!form.readyForPickup}
                onClick={() => update({ readyForPickup: false })}
                label="Not yet / Ha e so e be"
              />
            </div>
          </FormField>
        </Card>

        <div className="mt-stack-lg space-y-3">
          <Button
            size="lg"
            onClick={() => navigate("/farmer/register/review")}
            icon={<Icon name="chevron_right" />}
            iconPosition="right"
          >
            Review & Confirm / Hlahloba
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
            Back / Khutla
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
