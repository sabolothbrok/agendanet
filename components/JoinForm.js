"use client";

import { useState, useTransition } from "react";
import { joinWithInviteAction } from "@/app/actions/auth";

export default function JoinForm({ slug, token, businessName }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.target);
    startTransition(async () => {
      const res = await joinWithInviteAction(slug, token, fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold text-gray-900">Unirse a {businessName}</h1>
      <p className="mt-2 text-sm text-gray-600">
        Completa tu registro con teléfono. Luego podrás entrar solo con tu número.
      </p>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
          <input name="name" required className="input" placeholder="Tu nombre" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
          <input name="phone" type="tel" required className="input" placeholder="8888-8888" />
        </div>
        <button type="submit" disabled={isPending} className="btn btn-primary w-full">
          {isPending ? "Registrando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
