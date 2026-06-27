import AdminNav from "@/components/AdminNav";

export default function AdminShell({ slug, businessName, current, isPlatformAdmin, children }) {
  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <AdminNav
        slug={slug}
        businessName={businessName}
        current={current}
        isPlatformAdmin={isPlatformAdmin}
      />
      <main className="page-main min-w-0 flex-1 overflow-x-hidden">
        {isPlatformAdmin && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Estás administrando este negocio como{" "}
            <span className="font-medium">admin general</span>.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
