import { Routes, Route } from "react-router-dom";
import RequireRole from "./components/RequireRole";
import { Role } from "./context/RoleContext";
import { RegisterLotProvider } from "./pages/farmer/RegisterLotContext";

// Public
import LandingPage from "./pages/public/LandingPage";
import PublicLotVerification from "./pages/public/PublicLotVerification";
import NotFound from "./pages/public/NotFound";

// Auth
import Splash from "./pages/auth/Splash";
import WalletConnect from "./pages/auth/WalletConnect";
import RoleSelectionGate from "./pages/auth/RoleSelectionGate";
import WrongNetwork from "./pages/auth/WrongNetwork";
import Unauthorized from "./pages/auth/Unauthorized";
import FarmerOnboarding from "./pages/auth/FarmerOnboarding";
import ValidatorPending from "./pages/auth/ValidatorPending";
import NetworkHelp from "./pages/auth/NetworkHelp";

// Farmer
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import RegisterLotStep1 from "./pages/farmer/RegisterLotStep1";
import RegisterLotReview from "./pages/farmer/RegisterLotReview";
import RegisterLotSuccess from "./pages/farmer/RegisterLotSuccess";
import MyLotsHistory from "./pages/farmer/MyLotsHistory";
import LotDetail from "./pages/farmer/LotDetail";
import QRProofOfOrigin from "./pages/farmer/QRProofOfOrigin";
import FarmerMarketSell from "./pages/farmer/FarmerMarketSell";

// Validator
import ValidatorQueue from "./pages/validator/ValidatorQueue";
import ValidatorAuditLog from "./pages/validator/ValidatorAuditLog";

// Government
import GovernmentDashboard from "./pages/government/GovernmentDashboard";
import GovernmentNewsHub from "./pages/government/GovernmentNewsHub";

function RegisterLotFlow({ children }) {
  return <RegisterLotProvider>{children}</RegisterLotProvider>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/verify" element={<PublicLotVerification />} />
      <Route path="/verify/lot/:lotId" element={<PublicLotVerification />} />

      {/* Auth */}
      <Route path="/splash" element={<Splash />} />
      <Route path="/connect" element={<WalletConnect />} />
      <Route path="/role-select" element={<RoleSelectionGate />} />
      <Route path="/error/wrong-network" element={<WrongNetwork />} />
      <Route path="/error/unauthorized" element={<Unauthorized />} />
      <Route path="/onboarding/farmer" element={<FarmerOnboarding />} />
      <Route path="/onboarding/validator" element={<ValidatorPending />} />
      <Route path="/onboarding/government" element={<Unauthorized />} />
      <Route path="/help/network" element={<NetworkHelp />} />

      {/* Farmer (role-gated) */}
      <Route
        path="/farmer"
        element={
          <RequireRole role={Role.FARMER} redirectTo="/onboarding/farmer">
            <FarmerDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/farmer/register"
        element={
          <RequireRole role={Role.FARMER} redirectTo="/onboarding/farmer">
            <RegisterLotFlow>
              <RegisterLotStep1 />
            </RegisterLotFlow>
          </RequireRole>
        }
      />
      <Route
        path="/farmer/register/review"
        element={
          <RequireRole role={Role.FARMER} redirectTo="/onboarding/farmer">
            <RegisterLotFlow>
              <RegisterLotReview />
            </RegisterLotFlow>
          </RequireRole>
        }
      />
      <Route
        path="/farmer/register/success"
        element={
          <RequireRole role={Role.FARMER} redirectTo="/onboarding/farmer">
            <RegisterLotSuccess />
          </RequireRole>
        }
      />
      <Route
        path="/farmer/lots"
        element={
          <RequireRole role={Role.FARMER} redirectTo="/onboarding/farmer">
            <MyLotsHistory />
          </RequireRole>
        }
      />
      <Route
        path="/farmer/lots/:lotId"
        element={
          <RequireRole role={Role.FARMER} redirectTo="/onboarding/farmer">
            <LotDetail />
          </RequireRole>
        }
      />
      <Route
        path="/farmer/lots/:lotId/qr"
        element={
          <RequireRole role={Role.FARMER} redirectTo="/onboarding/farmer">
            <QRProofOfOrigin />
          </RequireRole>
        }
      />
      <Route
        path="/farmer/market"
        element={
          <RequireRole role={Role.FARMER} redirectTo="/onboarding/farmer">
            <FarmerMarketSell />
          </RequireRole>
        }
      />
      <Route
        path="/farmer/news"
        element={
          <RequireRole role={Role.FARMER} redirectTo="/onboarding/farmer">
            <GovernmentNewsHub />
          </RequireRole>
        }
      />

      {/* Validator (role-gated) */}
      <Route
        path="/validator"
        element={
          <RequireRole role={Role.VALIDATOR} redirectTo="/onboarding/validator">
            <ValidatorQueue />
          </RequireRole>
        }
      />
      <Route
        path="/validator/audit"
        element={
          <RequireRole role={Role.VALIDATOR} redirectTo="/onboarding/validator">
            <ValidatorAuditLog />
          </RequireRole>
        }
      />

      {/* Government (role-gated) */}
      <Route
        path="/government"
        element={
          <RequireRole role={Role.GOVERNMENT} redirectTo="/error/unauthorized">
            <GovernmentDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/government/news"
        element={
          <RequireRole role={Role.GOVERNMENT} redirectTo="/error/unauthorized">
            <GovernmentNewsHub />
          </RequireRole>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
