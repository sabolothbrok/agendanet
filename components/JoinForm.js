"use client";

import { useState, useTransition } from "react";
import { joinWithInviteAction } from "@/app/actions/auth";
import { unstable_rethrow } from "next/navigation";
import Spinner from "@/components/Spinner";

export default function JoinForm({ slug, token, businessName }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.target);
    startTransition(async () => {
      try {
        const res = await joinWithInviteAction(slug, token, fd);
        if (res?.error) setError(res.error);
      } catch (error) {
        unstable_rethrow(error);
        setError("No se pudo completar el registro. Intenta de nuevo.");
      }
    });
  }

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Unirse a {businessName}</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Completa tu registro con teléfono. Luego podrás entrar solo con tu número.
        Este enlace es abierto: cualquiera que lo tenga puede crear una cuenta hasta
        que expire.
      </p>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
          <input name="name" required className="input" placeholder="Tu nombre" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
          <input name="phone" type="tel" required className="input" placeholder="8888-8888" />
        </div>
        <button type="submit" disabled={isPending} className="btn btn-primary w-full">
          {isPending && <Spinner />}
          {isPending ? "Registrando..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
