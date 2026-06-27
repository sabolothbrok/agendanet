"use client";

import Link from "next/link";
import { Calendar, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#funciones", label: "Funciones" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    function onResize() {
      if (window.innerWidth >= 1024) setOpen(false);
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <>
      <header className="landing-header">
        <div className="landing-container landing-header-row">
          <Link href="/" className="landing-brand" onClick={() => setOpen(false)}>
            <span className="landing-brand-mark">
              <Calendar className="h-5 w-5" />
            </span>
            <span className="landing-brand-name">AgendaNet</span>
          </Link>

          <nav className="landing-nav-desktop" aria-label="Principal">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="landing-nav-link">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="landing-nav-desktop landing-nav-cta">
            <Link href="/login" className="landing-btn-ghost">
              Iniciar sesión
            </Link>
            <Link href="#precios" className="landing-btn-primary">
              Ver planes
            </Link>
          </div>

          <button
            type="button"
            className="landing-menu-btn"
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div
        id="landing-menu"
        className={`landing-menu ${open ? "landing-menu--open" : ""}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="landing-menu-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
          tabIndex={open ? 0 : -1}
        />
        <div className="landing-menu-panel" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="landing-menu-panel-header">
            <p className="text-sm font-semibold text-gray-900">Menú</p>
            <button
              type="button"
              className="landing-menu-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="landing-menu-link"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto border-t border-gray-200 pt-4 flex flex-col gap-2">
            <Link href="/login" className="landing-btn-secondary w-full" onClick={() => setOpen(false)}>
              Iniciar sesión
            </Link>
            <Link href="#precios" className="landing-btn-primary w-full" onClick={() => setOpen(false)}>
              Ver planes
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
