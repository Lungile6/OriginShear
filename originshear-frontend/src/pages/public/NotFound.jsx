import { Link } from "react-router-dom";
import TopAppBar from "../../components/nav/TopAppBar";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <TopAppBar role="AUTH" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-14">
        <p className="text-headline-xl font-bold text-primary mb-2">404</p>
        <p className="text-body-md text-on-surface-variant mb-6">This page doesn't exist.</p>
        <Link to="/" className="h-12 px-6 rounded-lg bg-primary text-on-primary font-semibold flex items-center">
          Back to ORIGINSHEAR
        </Link>
      </div>
    </div>
  );
}
