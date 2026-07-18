import { lazy, Suspense } from "react";
import { Routes, Route, Outlet, useLocation, Navigate, useParams } from "react-router-dom";
import RequireRole from "./components/RequireRole";
import { Role } from "./context/RoleContext";
import { RegisterLotProvider } from "./pages/farmer/RegisterLotContext";
import BottomNav from "./components/nav/BottomNav";

const LandingPage = lazy(() => import("./pages/public/LandingPage"));
const NotFound = lazy(() => import("./pages/public/NotFound"));
const PublicLotVerification = lazy(() => import("./pages/public/PublicLotVerification"));

const Splash = lazy(() => import("./pages/auth/Splash"));
const WalletConnect = lazy(() => import("./pages/auth/WalletConnect"));
const RoleSelectionGate = lazy(() => import("./pages/auth/RoleSelectionGate"));
const WrongNetwork = lazy(() => import("./pages/auth/WrongNetwork"));
const Unauthorized = lazy(() => import("./pages/auth/Unauthorized"));
const FarmerOnboarding = lazy(() => import("./pages/auth/FarmerOnboarding"));
const ValidatorPending = lazy(() => import("./pages/auth/ValidatorPending"));
const GovernmentPending = lazy(() => import("./pages/auth/GovernmentPending"));
const NetworkHelp = lazy(() => import("./pages/auth/NetworkHelp"));

const FarmerDashboard = lazy(() => import("./pages/farmer/FarmerDashboard"));
const RegisterLotStep1 = lazy(() => import("./pages/farmer/RegisterLotStep1"));
const RegisterLotStep2 = lazy(() => import("./pages/farmer/RegisterLotStep2"));
const RegisterLotReview = lazy(() => import("./pages/farmer/RegisterLotReview"));
const RegisterLotSuccess = lazy(() => import("./pages/farmer/RegisterLotSuccess"));
const MyLotsHistory = lazy(() => import("./pages/farmer/MyLotsHistory"));
const LotDetail = lazy(() => import("./pages/farmer/LotDetail"));
const QRProofOfOrigin = lazy(() => import("./pages/farmer/QRProofOfOrigin"));
const FarmerMarketSell = lazy(() => import("./pages/farmer/FarmerMarketSell"));

const ValidatorDashboard = lazy(() => import("./pages/validator/ValidatorDashboard"));
const ValidatorQueue = lazy(() => import("./pages/validator/ValidatorQueue"));
const ValidatorAuditLog = lazy(() => import("./pages/validator/ValidatorAuditLog"));
const ValidatorReleaseQueue = lazy(() => import("./pages/validator/ValidatorReleaseQueue"));

const GovernmentDashboard = lazy(() => import("./pages/government/GovernmentDashboard"));
const GovernmentNewsHub = lazy(() => import("./pages/government/GovernmentNewsHub"));
const GovernmentComposeNews = lazy(() => import("./pages/government/GovernmentComposeNews"));

const BuyerDashboard = lazy(() => import("./pages/buyer/BuyerDashboard"));
const BuyerMarketplace = lazy(() => import("./pages/buyer/BuyerMarketplace"));
const LotPurchaseDetail = lazy(() => import("./pages/buyer/LotPurchaseDetail"));
const BuyerPurchaseHistory = lazy(() => import("./pages/buyer/BuyerPurchaseHistory"));
const BuyerLotVerification = lazy(() => import("./pages/buyer/BuyerLotVerification"));

function RegisterLotFlow() {
  return (
    <RegisterLotProvider>
      <Outlet />
    </RegisterLotProvider>
  );
}

function GlobalBottomNavigation() {
  const { pathname } = useLocation();

  let role = null;
  if (pathname === "/" || pathname === "/news") role = "PUBLIC";
  else if (pathname.startsWith("/farmer")) role = "FARMER";
  else if (pathname.startsWith("/validator")) role = "VALIDATOR";
  else if (pathname.startsWith("/government")) role = "GOVERNMENT";
  else if (pathname.startsWith("/buyer")) role = "BUYER";

  if (!role) return null;

  return <BottomNav role={role} />;
}

function LegacyVerifyLotRedirect() {
  const { lotId } = useParams();
  const { search } = useLocation();
  return <Navigate to={`/verify/lot/${lotId}${search}`} replace />;
}

function PageLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-label="Loading page"
      />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/news" element={<GovernmentNewsHub />} />
        <Route path="/verify" element={<PublicLotVerification />} />
        <Route path="/verify/lot/:lotId" element={<PublicLotVerification />} />
        <Route path="/public/verify" element={<Navigate to="/verify" replace />} />
        <Route path="/public/verify/lot/:lotId" element={<LegacyVerifyLotRedirect />} />

        {/* Auth */}
        <Route path="/splash" element={<Splash />} />
        <Route path="/connect" element={<WalletConnect />} />
        <Route path="/role-select" element={<RoleSelectionGate />} />
        <Route path="/error/wrong-network" element={<WrongNetwork />} />
        <Route path="/error/unauthorized" element={<Unauthorized />} />
        <Route path="/onboarding/farmer" element={<FarmerOnboarding />} />
        <Route path="/onboarding/validator" element={<ValidatorPending />} />
        <Route path="/onboarding/government" element={<GovernmentPending />} />
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
          element={
            <RequireRole role={Role.FARMER} redirectTo="/onboarding/farmer">
              <RegisterLotFlow />
            </RequireRole>
          }
        >
          <Route path="/farmer/register" element={<RegisterLotStep1 />} />
          <Route path="/farmer/register/logistics" element={<RegisterLotStep2 />} />
          <Route path="/farmer/register/review" element={<RegisterLotReview />} />
        </Route>
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
        <Route path="/farmer/news" element={<Navigate to="/news" replace />} />

        {/* Validator (role-gated) */}
        <Route
          path="/validator"
          element={
            <RequireRole role={Role.VALIDATOR} redirectTo="/onboarding/validator">
              <ValidatorDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/validator/queue"
          element={
            <RequireRole role={Role.VALIDATOR} redirectTo="/onboarding/validator">
              <ValidatorQueue />
            </RequireRole>
          }
        />
        <Route
          path="/validator/release"
          element={
            <RequireRole role={Role.VALIDATOR} redirectTo="/onboarding/validator">
              <ValidatorReleaseQueue />
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
            <RequireRole role={Role.GOVERNMENT} redirectTo="/onboarding/government">
              <GovernmentDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/government/news"
          element={
            <RequireRole role={Role.GOVERNMENT} redirectTo="/onboarding/government">
              <GovernmentNewsHub />
            </RequireRole>
          }
        />
        <Route
          path="/government/news/compose"
          element={
            <RequireRole role={Role.GOVERNMENT} redirectTo="/onboarding/government">
              <GovernmentComposeNews />
            </RequireRole>
          }
        />

        {/* Buyer */}
        <Route path="/buyer" element={<BuyerDashboard />} />
        <Route path="/buyer/marketplace" element={<BuyerMarketplace />} />
        <Route path="/buyer/lots/:lotId" element={<LotPurchaseDetail />} />
        <Route path="/buyer/purchases" element={<BuyerPurchaseHistory />} />
        <Route path="/buyer/news" element={<Navigate to="/news" replace />} />
        <Route path="/buyer/verify" element={<BuyerLotVerification />} />
        <Route path="/buyer/verify/lot/:lotId" element={<BuyerLotVerification />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <GlobalBottomNavigation />
    </Suspense>
  );
}
