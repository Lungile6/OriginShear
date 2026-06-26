import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-surface-container to-surface">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-sm border-t-4 border-t-error p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-error-container/60 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8 text-error">
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
              <circle cx="12" cy="15.5" r="1" />
            </svg>
          </div>
          <h1 className="text-headline-md font-bold mb-2">Access Not Authorised</h1>
          <p className="text-body-md text-on-surface-variant mb-6">
            Your wallet does not have the permissions needed for this section.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="w-full h-14 rounded-lg bg-role-validator text-white font-semibold mb-3"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/role-select")}
            className="w-full h-12 rounded-lg border border-outline-variant text-on-surface font-semibold inline-flex items-center justify-center gap-2"
          >
            Sign in as a different role
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <hr className="my-5 border-outline-variant" />
          <p className="text-label-md text-on-surface-variant uppercase tracking-wide mb-2">
            Technical error context
          </p>
          <div className="bg-surface-container rounded-lg p-3">
            <code className="text-label-sm text-on-surface-variant font-mono break-all">
              ERR_AUTH_FORBIDDEN_ROLE_0x19C_ORIGINSHEAR
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
