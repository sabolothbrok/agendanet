"use client";

import { useState, useTransition } from "react";
import { platformUpdateProfile } from "@/app/actions/platform";
import { formatPhone } from "@/lib/utils";

export default function PlatformSettingsForm({ profile }) {
  const [name, setName] = useState(profile.name);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    const fd = new FormData(e.target);
    startTransition(async () => {
      const res = await platformUpdateProfile(fd);
      if (res?.error) setError(res.error);
      else setMessage("Perfil actualizado.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-xl space-y-4 p-4 sm:p-6">
      <div>
        <h2 className="font-semibold text-gray-900">Tu perfil</h2>
        <p className="mt-1 text-sm text-gray-600">
          Datos del administrador general de la plataforma.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">Nombre</label>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600">Teléfono</label>
        <input
          type="text"
          readOnly
          value={formatPhone(profile.phone)}
          className="input bg-gray-50 text-gray-500"
        />
        <p className="mt-1 text-xs text-gray-500">El teléfono no se puede cambiar.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button type="submit" disabled={isPending} className="btn btn-primary w-full sm:w-auto">
        Guardar cambios
      </button>
    </form>
  );
}
