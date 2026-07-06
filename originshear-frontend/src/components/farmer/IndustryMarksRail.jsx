import { Link } from "react-router-dom";
import { useFarmerMarks } from "../../hooks/useFarmerMarks";
import { MarkStatus, MarkTypeLabel } from "../../contracts/IndustryMarkRegistry";
import Icon from "../ui/Icon";

const MARK_CHIP_STYLES = [
  "bg-secondary-container text-on-secondary-container",
  "bg-primary-container text-on-primary-container",
  "bg-surface-container-highest text-on-surface",
];

const MARK_ICONS = ["verified", "star", "eco"];

/**
 * Horizontal industry-marks chip rail from Stitch farmer_dashboard.
 */
export default function IndustryMarksRail({ farmerAddress }) {
  const { marks, isLoading } = useFarmerMarks(farmerAddress);
  const activeMarks = marks.filter((m) => m.status === MarkStatus.ACTIVE);

  if (isLoading || activeMarks.length === 0) return null;

  return (
    <section className="mt-stack-lg">
      <div className="flex overflow-x-auto hide-scrollbar px-margin-mobile gap-stack-sm pb-2">
        {activeMarks.map((mark, i) => (
          <div
            key={mark.markId.toString()}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border border-outline-variant whitespace-nowrap shrink-0 ${
              MARK_CHIP_STYLES[i % MARK_CHIP_STYLES.length]
            }`}
          >
            <Icon name={MARK_ICONS[i % MARK_ICONS.length]} size={18} />
            <span className="text-label-sm">
              {mark.description || MarkTypeLabel[mark.markType] || "Industry Mark"}
            </span>
          </div>
        ))}
        <Link
          to="/farmer/lots"
          className="flex items-center gap-1 px-3 py-2 text-primary text-label-sm font-semibold whitespace-nowrap shrink-0"
        >
          View all
          <Icon name="chevron_right" size={16} />
        </Link>
      </div>
    </section>
  );
}
