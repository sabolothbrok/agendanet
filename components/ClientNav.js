import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { formatPhone } from "@/lib/utils";
import { Calendar, List, LogOut } from "lucide-react";

export default function ClientNav({
  slug,
  businessName,
  customerName,
  customerPhone,
  isPremium,
  current,
}) {
  const links = [
    { href: `/b/${slug}/app`, label: "Reservar", short: "Reservar", icon: Calendar },
    {
      href: `/b/${slug}/app/reservations`,
      label: "Mis reservas",
      short: "Reservas",
      icon: List,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{businessName}</p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-gray-900">
                {customerName?.trim() || "Cliente"}
              </p>
              {isPremium && <span className="badge badge-warning shrink-0">Premium</span>}
            </div>
            {customerPhone && (
              <p className="truncate text-xs text-gray-500">{formatPhone(customerPhone)}</p>
            )}
          </div>
          <form action={logoutAction} className="hidden sm:block">
            <input type="hidden" name="redirectTo" value={`/b/${slug}/app/login`} />
            <button type="submit" className="btn btn-secondary text-sm">
              Salir
            </button>
          </form>
          <form action={logoutAction} className="sm:hidden">
            <input type="hidden" name="redirectTo" value={`/b/${slug}/app/login`} />
            <button type="submit" className="btn btn-secondary p-2" aria-label="Salir">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <nav
        className="client-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:hidden"
        aria-label="Navegación cliente"
      >
        <div className="grid grid-cols-2">
          {links.map(({ href, short, icon: Icon }) => {
            const active = current === href;
            return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium ${
                active ? "text-gray-900" : "text-gray-500"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              {short}
            </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop tabs */}
      <div className="hidden border-b border-gray-200 bg-white md:block">
        <div className="mx-auto flex max-w-5xl gap-1 px-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = current === href;
            return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
