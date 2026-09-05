"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { adminSearchCustomers } from "@/app/actions/admin";
import { formatPhone } from "@/lib/utils";

function useHotkey(open, setOpen) {
  const ref = useRef({ open, setOpen });

  useEffect(() => {
    ref.current = { open, setOpen };
  });

  useEffect(() => {
    function onKeyDown(event) {
      const isK = event.key === "k" || event.key === "K";
      if ((event.metaKey || event.ctrlKey) && isK) {
        event.preventDefault();
        ref.current.setOpen((v) => !v);
        return;
      }
      if (event.key === "Escape" && ref.current.open) {
        ref.current.setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export default function CommandPalette({ slug, open, setOpen }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useHotkey(open, setOpen);

  const base = `/b/${slug}/admin`;
  const commands = useMemo(
    () => [
      { id: "home", label: "Inicio", href: base, icon: LayoutDashboard },
      { id: "calendar", label: "Calendario", href: `${base}/calendar`, icon: Calendar },
      { id: "reports", label: "Reporte semanal", href: `${base}/reports`, icon: BarChart3 },
      { id: "customers", label: "Clientes", href: `${base}/customers`, icon: Users },
      { id: "services", label: "Servicios", href: `${base}/services`, icon: ClipboardList },
      { id: "settings", label: "Configuración", href: `${base}/settings`, icon: Settings },
    ],
    [base]
  );

  const matchedCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  function handleQueryChange(value) {
    setQuery(value);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setCustomers([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      const res = await adminSearchCustomers(slug, value.trim());
      setCustomers(res?.customers || []);
      setSearching(false);
    }, 250);
  }

  function close() {
    setOpen(false);
    setQuery("");
    setCustomers([]);
  }

  function goTo(href) {
    router.push(href);
    close();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="command-palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            className="command-palette-backdrop"
            onClick={close}
            aria-label="Cerrar"
            tabIndex={-1}
          />
          <motion.div
            className="command-palette-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Buscador rápido"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="command-palette-input-row">
              <Search className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Buscar secciones o clientes por nombre/teléfono…"
                className="command-palette-input"
              />
              <kbd className="command-palette-kbd">Esc</kbd>
            </div>

            <div className="command-palette-results">
              {matchedCommands.length > 0 && (
                <div className="command-palette-group">
                  <p className="command-palette-group-label">Secciones</p>
                  {matchedCommands.map(({ id, label, href, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      className="command-palette-item"
                      onClick={() => goTo(href)}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {query.trim().length >= 2 && (
                <div className="command-palette-group">
                  <p className="command-palette-group-label">Clientes</p>
                  {searching ? (
                    <p className="command-palette-empty">Buscando…</p>
                  ) : customers.length === 0 ? (
                    <p className="command-palette-empty">Sin resultados.</p>
                  ) : (
                    customers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="command-palette-item"
                        onClick={() => goTo(`${base}/customers`)}
                      >
                        <Users className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-left">{c.name}</span>
                        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                          {formatPhone(c.phone)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
