"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { platformCreateBusiness } from "@/app/actions/platform";
import { slugify } from "@/lib/utils";

export default function CreateBusinessForm({ businessTypes }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function onNameChange(value) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.target);
    startTransition(async () => {
      const res = await platformCreateBusiness(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-xl space-y-4 p-4 sm:p-6">
      <div>
        <h2 className="font-semibold text-gray-900">Datos del negocio</h2>
        <p className="mt-1 text-sm text-gray-600">
          Se creará el negocio con un administrador local y una estación por defecto.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">Nombre del negocio</label>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="input"
          placeholder="Ej. Barbería Central"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">Identificador (URL)</label>
        <input
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className="input"
          placeholder="barberia-central"
        />
        <p className="mt-1 text-xs text-gray-500">
          Se usará en la URL: /b/{slug || "tu-negocio"}/...
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">Tipo de negocio</label>
        {businessTypes.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay tipos configurados.{" "}
            <Link href="/platform/settings" className="font-medium text-gray-900 underline">
              Agrégalos en Configuración
            </Link>
            .
          </p>
        ) : (
          <select
            name="business_type"
            className="input"
            defaultValue={businessTypes[0]?.slug}
            required
          >
            {businessTypes.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Hora de apertura</label>
          <input name="open_hour" type="time" defaultValue="09:00" className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Hora de cierre</label>
          <input name="close_hour" type="time" defaultValue="18:00" className="input" />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="font-medium text-gray-900">Administrador del negocio</h3>
        <p className="mt-1 text-sm text-gray-600">
          Una persona por negocio. Entrará con este teléfono al panel del negocio.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">Nombre del admin</label>
        <input name="admin_name" required className="input" placeholder="Ej. María" />
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">Teléfono del admin</label>
        <input
          name="admin_phone"
          type="tel"
          required
          className="input"
          placeholder="8888-8888"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending || businessTypes.length === 0}
        className="btn btn-primary w-full sm:w-auto"
      >
        {isPending ? "Creando..." : "Crear negocio"}
      </button>
    </form>
  );
}
