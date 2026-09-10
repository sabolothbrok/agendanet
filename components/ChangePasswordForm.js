"use client";

import { useRef, useState, useTransition } from "react";
import { useToast } from "@/hooks/useToast";
import Spinner from "@/components/Spinner";

export default function ChangePasswordForm({ slug, action, hasPassword }) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const formRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    startTransition(async () => {
      const res = slug !== undefined ? await action(slug, fd) : await action(fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(hasPassword ? "Contraseña actualizada." : "Contraseña creada.");
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card max-w-xl space-y-4 p-4 sm:p-6">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Contraseña</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {hasPassword
            ? "Cambia la contraseña que usas para iniciar sesión."
            : "Aún no tienes una contraseña. Crea una para proteger esta cuenta."}
        </p>
      </div>

      {hasPassword && (
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Contraseña actual</label>
          <input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="input"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Nueva contraseña</label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Confirma la nueva contraseña</label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Al menos 8 caracteres.</p>
      </div>

      <button type="submit" disabled={isPending} className="btn btn-primary w-full sm:w-auto">
        {isPending && <Spinner />}
        {isPending ? "Guardando..." : hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
      </button>
    </form>
  );
}
