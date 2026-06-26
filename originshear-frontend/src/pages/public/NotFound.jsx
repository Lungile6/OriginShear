import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-headline-xl font-bold text-primary mb-2">404</p>
      <p className="text-body-md text-on-surface-variant mb-6">This page doesn't exist.</p>
      <Link to="/" className="h-12 px-6 rounded-lg bg-primary text-on-primary font-semibold flex items-center">
        Back to ORIGINSHEAR
      </Link>
    </div>
  );
}
