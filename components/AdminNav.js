import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { logoutAction } from "@/app/actions/auth";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  ArrowLeft,
  BarChart3,
  Search,
} from "lucide-react";

const links = [
  { href: "", label: "Inicio", short: "Inicio", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendario", short: "Agenda", icon: Calendar },
  { href: "/reports", label: "Reporte", short: "Reporte", icon: BarChart3 },
  { href: "/customers", label: "Clientes", short: "Clientes", icon: Users },
  { href: "/services", label: "Servicios", short: "Servicios", icon: ClipboardList },
  { href: "/settings", label: "Configuración", short: "Ajustes", icon: Settings },
];

function isActive(current, href) {
  return current === href || (href === "" && (current === "/" || current === ""));
}

export default function AdminNav({ slug, businessName, current, isPlatformAdmin, onOpenSearch }) {
  const base = `/b/${slug}/admin`;

  return (
    <>
      {/* Top bar — mobile */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Admin
            </p>
            <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{businessName}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-9 w-9" />
            <form action={logoutAction}>
              <input type="hidden" name="redirectTo" value="/" />
              <button
                type="submit"
                className="btn btn-secondary p-2"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Sidebar — desktop */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 md:flex">
        <div className="border-b border-gray-200 px-4 py-5 dark:border-gray-700">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Admin</p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{businessName}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <button
            type="button"
            onClick={onOpenSearch}
            className="mb-2 flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Search size={16} />
            <span className="flex-1 text-left">Buscar</span>
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[0.6875rem] font-sans text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
              ⌘K
            </kbd>
          </button>
          {isPlatformAdmin && (
            <Link
              href="/platform"
              className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ArrowLeft size={18} />
              Mis negocios
            </Link>
          )}
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={`${base}${href}`}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                isActive(current, href)
                  ? "nav-link-active"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-700">
          <ThemeToggle className="h-9 w-9 shrink-0" />
          <form action={logoutAction} className="flex-1">
            <input
              type="hidden"
              name="redirectTo"
              value={isPlatformAdmin ? "/platform" : "/"}
            />
            <button type="submit" className="btn btn-secondary w-full text-sm">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Bottom nav — mobile */}
      <nav
        className="app-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 md:hidden"
        aria-label="Navegación admin"
      >
        <div className="grid grid-cols-6 min-w-0 overflow-x-auto">
          {links.map(({ href, label, short, icon: Icon }) => (
            <Link
              key={href}
              href={`${base}${href}`}
              aria-label={label}
              aria-current={isActive(current, href) ? "page" : undefined}
              className={`flex min-h-[3.25rem] flex-col items-center justify-center px-0.5 py-1.5 ${
                isActive(current, href) ? "nav-icon-active" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Icon size={20} strokeWidth={isActive(current, href) ? 2.25 : 1.75} />
              <span className="nav-bottom-label">{short}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
