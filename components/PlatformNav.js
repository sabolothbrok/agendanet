import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Building2, LayoutDashboard, LogOut, Plus, Settings } from "lucide-react";

const links = [
  { href: "", label: "Mis negocios", icon: LayoutDashboard },
  { href: "/businesses/new", label: "Nuevo negocio", icon: Plus },
  { href: "/settings", label: "Configuración", icon: Settings },
];

function isActive(current, href) {
  if (href === "") return current === "/" || current === "";
  return current === href || current.startsWith(`${href}/`);
}

export default function PlatformNav({ adminName, current }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Admin general
            </p>
            <p className="truncate font-semibold text-gray-900">{adminName}</p>
          </div>
          <form action={logoutAction}>
            <input type="hidden" name="redirectTo" value="/platform/login" />
            <button type="submit" className="btn btn-secondary p-2" aria-label="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="border-b border-gray-200 px-4 py-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            <Building2 size={14} />
            Admin general
          </p>
          <p className="mt-1 font-semibold text-gray-900">{adminName}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={`/platform${href}`}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                isActive(current, href)
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="border-t border-gray-200 p-3">
          <input type="hidden" name="redirectTo" value="/platform/login" />
          <button type="submit" className="btn btn-secondary w-full text-sm">
            Cerrar sesión
          </button>
        </form>
      </aside>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegación plataforma"
      >
        <div className="grid grid-cols-3 gap-0">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={`/platform${href}`}
              className={`flex flex-col items-center justify-center gap-0.5 px-1 py-2.5 text-[10px] font-medium ${
                isActive(current, href) ? "text-gray-900" : "text-gray-500"
              }`}
            >
              <Icon size={20} strokeWidth={isActive(current, href) ? 2.25 : 1.75} />
              <span className="truncate">{label.split(" ").pop()}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
