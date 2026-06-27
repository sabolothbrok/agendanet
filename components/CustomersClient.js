"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import {
  adminGenerateInvite,
  adminDeleteCustomer,
  adminTogglePremium,
} from "@/app/actions/admin";
import { formatPhone, formatTime } from "@/lib/utils";
import { INVITE_TTL_MINUTES } from "@/lib/constants";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function CustomersClient({ slug, customers: initial }) {
  const [customers, setCustomers] = useState(initial);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  async function handleCopy() {
    if (!inviteLink) return;
    try {
      await copyToClipboard(inviteLink);
      setCopied(true);
      toast.success("Enlace copiado.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function generateLink() {
    startTransition(async () => {
      const res = await adminGenerateInvite(slug);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.link) {
        setInviteLink(res.link);
        setInviteExpiresAt(res.expiresAt || null);
        setCopied(false);
        try {
          await copyToClipboard(res.link);
          setCopied(true);
          toast.success("Enlace generado y copiado.");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.success("Enlace generado.");
        }
      }
    });
  }

  async function remove(id) {
    const ok = await confirm({
      title: "Eliminar cliente",
      message: "El cliente perderá acceso a la app. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      cancelLabel: "Volver",
    });
    if (!ok) return;
    const res = await adminDeleteCustomer(slug, id);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    setCustomers((c) => c.filter((x) => x.id !== id));
    toast.success("Cliente eliminado.");
  }

  async function togglePremium(id, current) {
    const res = await adminTogglePremium(slug, id, !current);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    setCustomers((c) =>
      c.map((x) => (x.id === id ? { ...x, is_premium: !current } : x))
    );
    toast.success(!current ? "Cliente marcado como premium." : "Cliente marcado como estándar.");
  }

  return (
    <div className="space-y-6">
      {dialog}
      <div className="card p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900">Invitar clientes</h2>
        <p className="mt-1 text-sm text-gray-600">
          Genera un enlace y compártelo por mensaje. El cliente se registra con su teléfono.
          El enlace vence en {INVITE_TTL_MINUTES} minutos.
        </p>
        <button
          type="button"
          onClick={generateLink}
          disabled={isPending}
          className="btn btn-primary mt-4 w-full sm:w-auto"
        >
          {isPending ? "Generando…" : "Generar enlace"}
        </button>
        {inviteLink && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <p className="min-w-0 flex-1 break-all rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                {inviteLink}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-secondary shrink-0 sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden />
                    Copiar enlace
                  </>
                )}
              </button>
            </div>
            {inviteExpiresAt && (
              <p className="text-xs text-gray-500">
                Válido hasta las {formatTime(inviteExpiresAt)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {customers.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{c.name || "—"}</p>
                <p className="text-sm text-gray-600">{formatPhone(c.phone)}</p>
              </div>
              <button
                type="button"
                onClick={() => togglePremium(c.id, c.is_premium)}
                className={`badge shrink-0 ${c.is_premium ? "badge-success" : "badge-neutral"}`}
              >
                {c.is_premium ? "Premium" : "Estándar"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => remove(c.id)}
              className="btn btn-danger mt-3 w-full text-sm"
            >
              Eliminar cliente
            </button>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="card p-8 text-center text-gray-500">Aún no hay clientes.</p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Teléfono</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Premium</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{formatPhone(c.phone)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => togglePremium(c.id, c.is_premium)}
                    className={`badge ${c.is_premium ? "badge-success" : "badge-neutral"}`}
                  >
                    {c.is_premium ? "Sí" : "No"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <p className="p-8 text-center text-gray-500">Aún no hay clientes.</p>
        )}
      </div>
    </div>
  );
}
