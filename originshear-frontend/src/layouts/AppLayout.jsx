import TopAppBar from "../components/nav/TopAppBar";

/**
 * Shared chrome for all authenticated, role-bound screens: fixed top app
 * bar, scrollable content area, fixed bottom nav. Public/auth screens
 * (landing, splash, role gate) render without this layout.
 */
export default function AppLayout({ role, title, children }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-on-surface">
      <TopAppBar title={title} />
      <main className="flex-1 pt-14 pb-20 max-w-[1024px] w-full mx-auto">{children}</main>
    </div>
  );
}
