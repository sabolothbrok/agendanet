import ScrollReset from "@/components/ScrollReset";
import AdminNav from "@/components/AdminNav";

export default function AdminShell({ slug, businessName, current, isPlatformAdmin, children }) {
  return (
    <div className="app-shell min-h-screen w-full max-w-full min-w-0 overflow-x-hidden md:flex">
      <ScrollReset />
      <AdminNav
        slug={slug}
        businessName={businessName}
        current={current}
        isPlatformAdmin={isPlatformAdmin}
      />
      <main className="page-main min-w-0 w-full max-w-full flex-1 overflow-x-hidden">
        {isPlatformAdmin && (
          <div className="surface-warning mb-4 rounded-lg px-4 py-3 text-sm">
            Estás administrando este negocio como{" "}
            <span className="font-medium">admin general</span>.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
