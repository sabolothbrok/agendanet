"use client";

import { useState, useTransition } from "react";
import { adminRenameSpace, adminSetSpaceCount } from "@/app/actions/admin";
import { useToast } from "@/hooks/useToast";

export default function SpacesSettings({ slug, spaces: initial }) {
  const [spaces, setSpaces] = useState(initial);
  const [count, setCount] = useState(String(initial.length || 1));
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function applyCount() {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 20) {
      toast.error("Ingresa un número entre 1 y 20.");
      return;
    }

    startTransition(async () => {
      const res = await adminSetSpaceCount(slug, n);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.spaces) {
        setSpaces(res.spaces);
        setCount(String(res.spaces.length));
      }
      toast.success("Cantidad de estaciones actualizada.");
    });
  }

  function rename(spaceId, name) {
    startTransition(async () => {
      const res = await adminRenameSpace(slug, spaceId, name);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setSpaces((prev) =>
        prev.map((s) => (s.id === spaceId ? { ...s, name: name.trim() } : s))
      );
      toast.success("Nombre de estación guardado.");
    });
  }

  return (
    <div className="card space-y-4 p-4 sm:p-6">
      <div>
        <h2 className="font-semibold text-gray-900">Estaciones</h2>
        <p className="mt-1 text-sm text-gray-600">
          Define cuántas estaciones tiene tu negocio. El calendario y las reservas se
          adaptan automáticamente (1 columna por estación).
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">
          Cantidad de estaciones
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={count}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              if (digits === "") {
                setCount("");
                return;
              }
              setCount(String(parseInt(digits, 10)));
            }}
            className="input sm:max-w-[8rem]"
            aria-label="Cantidad de estaciones"
          />
          <button
            type="button"
            onClick={applyCount}
            disabled={isPending}
            className="btn btn-primary w-full shrink-0 sm:w-auto"
          >
            Aplicar cantidad
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">Mínimo 1, máximo 20.</p>
      </div>

      {spaces.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700">Nombres</p>
          {spaces.map((space) => (
            <div key={space.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                defaultValue={space.name}
                className="input flex-1"
                onBlur={(e) => {
                  if (e.target.value.trim() !== space.name) {
                    rename(space.id, e.target.value);
                  }
                }}
              />
            </div>
          ))}
          <p className="text-xs text-gray-500">
            Edita el nombre y sal del campo para guardar (ej. Bahía 1, Silla A).
          </p>
        </div>
      )}

      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        Si reduces la cantidad, se ocultan las últimas estaciones. No se pueden quitar
        estaciones con citas futuras; cancela o reprograma esas citas primero.
      </p>
    </div>
  );
}
