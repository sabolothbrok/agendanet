import PlatformNav from "@/components/PlatformNav";

export default function PlatformShell({ adminName, current, children }) {
  return (
    <div className="app-shell min-h-screen w-full min-w-0 overflow-x-clip bg-gray-50 md:flex">
      <PlatformNav adminName={adminName} current={current} />
      <main className="page-main min-w-0 w-full max-w-full flex-1 overflow-x-clip">{children}</main>
    </div>
  );
}
