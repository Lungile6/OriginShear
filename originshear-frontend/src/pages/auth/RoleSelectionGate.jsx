import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useRole, Role } from "../../context/RoleContext";

const CARDS = [
  {
    key: "farmer",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
        <path d="M5 16h14M7 16V8l5-3 5 3v8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="11" r="2" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
        <path d="M4 10h16M6 10v9M18 10v9M3 19h18M12 3l8 4H4l8-4Z" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
        <circle cx="9" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
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
    if (card.role === null) {
      navigate(card.path);
      return;
    }
    if (card.role === Role.BUYER) {
      navigate(card.path);
      return;
    }
    if (!isConnected) {
      navigate("/connect", { state: { intendedRole: card.role } });
      return;
    }
    if (isLoadingRoles) return; // wait for role check to settle
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
    <div className="min-h-dvh bg-gradient-to-b from-surface-container to-surface px-6 py-10">
      <div className="max-w-md mx-auto">
        <h1 className="text-headline-lg font-extrabold text-role-validator text-center mb-1">
          ORIGINSHEAR
        </h1>
        <p className="text-body-md text-on-surface-variant text-center mb-8">
          Who are you signing in as?
        </p>

        <div className="space-y-4">
          {CARDS.map((card) => (
            <button
              key={card.key}
              onClick={() => handleSelect(card)}
              className={`w-full text-left bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant border-l-4 ${card.border} p-5 active:scale-[0.99] transition-transform`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
                {card.icon}
              </div>
              <h2 className="text-headline-sm font-bold text-on-surface">{card.title}</h2>
              <p className="text-body-sm text-on-surface-variant mt-1 mb-3">{card.desc}</p>
              <span className="text-body-sm font-semibold text-primary inline-flex items-center gap-1">
                Continue
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
