import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useRole, Role } from "../../context/RoleContext";
import { DEV_BYPASS_ROLE_GUARDS } from "../../lib/devBypass";
import TopAppBar from "../../components/nav/TopAppBar";
import Icon from "../../components/ui/Icon";

const CARDS = [
  {
    key: "farmer",
    icon: "agriculture",
    border: "border-l-role-farmer",
    iconBg: "bg-role-farmer/10 text-role-farmer",
    title: "Farmer",
    desc: "Register harvest lots, track validation, and sell directly to buyers via cUSD.",
    role: Role.FARMER,
    path: "/farmer",
    pendingPath: "/onboarding/farmer",
  },
  {
    key: "validator",
    icon: "verified_user",
    border: "border-l-role-validator",
    iconBg: "bg-role-validator/10 text-role-validator",
    title: "LNWMGA Validator",
    desc: "Review pending lots, approve or reject, and release marketplace payments.",
    role: Role.VALIDATOR,
    path: "/validator",
    pendingPath: "/onboarding/validator",
  },
  {
    key: "government",
    icon: "account_balance",
    border: "border-l-role-government",
    iconBg: "bg-role-government/10 text-role-government",
    title: "Government",
    desc: "Manage industry marks, publish bulletins, and oversee district compliance.",
    role: Role.GOVERNMENT,
    path: "/government",
    pendingPath: "/onboarding/government",
  },
  {
    key: "buyer",
    icon: "shopping_cart",
    border: "border-l-role-buyer",
    iconBg: "bg-role-buyer/10 text-role-buyer",
    title: "Buyer / Verifier",
    desc: "Browse validated lots, purchase wool & mohair, and verify proof of origin.",
    role: Role.BUYER,
    path: "/buyer",
    pendingPath: "/connect",
  },
];

export default function RoleSelectionGate() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { roles, isLoadingRoles, hasContracts } = useRole();

  function handleSelect(card) {
    if (DEV_BYPASS_ROLE_GUARDS || card.role === null || card.role === Role.BUYER) {
      navigate(card.path);
      return;
    }
    if (!isConnected) {
      navigate("/connect", { state: { intendedRole: card.role } });
      return;
    }
    if (isLoadingRoles) return;
    if (!hasContracts) {
      navigate("/error/wrong-network");
      return;
    }
    if (roles.includes(card.role)) {
      navigate(card.path);
    } else {
      navigate(card.pendingPath);
    }
  }

  return (
    <div className="min-h-dvh bg-[#F5F4F0]">
      <TopAppBar role="AUTH" />
      <div className="px-margin-mobile py-10 pt-20 max-w-md mx-auto">
        <h1 className="text-headline-lg font-extrabold text-role-validator text-center mb-1">
          ORIGINSHEAR
        </h1>
        <p className="text-body-md text-on-surface-variant text-center mb-8">
          Who are you signing in as?
        </p>

        <div className="space-y-stack-md">
          {CARDS.map((card) => (
            <button
              key={card.key}
              onClick={() => handleSelect(card)}
              className={`w-full text-left bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant border-l-4 ${card.border} p-5 active:scale-[0.99] transition-transform`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
                <Icon name={card.icon} />
              </div>
              <h2 className="text-headline-sm font-bold text-on-surface">{card.title}</h2>
              <p className="text-body-sm text-on-surface-variant mt-1 mb-3">{card.desc}</p>
              <span className="text-body-sm font-semibold text-primary inline-flex items-center gap-1">
                Continue
                <Icon name="arrow_forward" className="!text-base" />
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-label-sm text-on-surface-variant mt-8">
          Signing in requires wallet permission for identity verification on the ledger.
        </p>
      </div>
    </div>
  );
}
