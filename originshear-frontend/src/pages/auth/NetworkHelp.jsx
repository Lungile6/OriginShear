import { useNavigate } from "react-router-dom";

const STEPS = [
  "Open your wallet app (Valora or MetaMask).",
  'Go to Settings → Networks → Add Network.',
  "Enter Celo Alfajores: RPC https://alfajores-forno.celo-testnet.org, Chain ID 44787, Currency CELO.",
  "Save, then switch to the Alfajores network.",
  "Return to ORIGINSHEAR and refresh this page.",
];

export default function NetworkHelp() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-background px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-on-surface-variant mb-6 flex items-center gap-1 text-body-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>
      <h1 className="text-headline-md font-bold mb-4">Switch network manually</h1>
      <ol className="space-y-4">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-body-sm">
              {i + 1}
            </span>
            <p className="text-body-md text-on-surface pt-0.5">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
