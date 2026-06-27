import PlatformNav from "@/components/PlatformNav";

export default function PlatformShell({ adminName, current, children }) {
  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <PlatformNav adminName={adminName} current={current} />
      <main className="page-main flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
