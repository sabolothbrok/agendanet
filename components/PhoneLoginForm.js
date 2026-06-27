"use client";

import { useState, useTransition } from "react";

export default function PhoneLoginForm({ slug, action, title, subtitle }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.target);
    startTransition(async () => {
      const res = slug !== undefined ? await action(slug, fd) : await action(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            name="phone"
            type="tel"
            required
            placeholder="8888-8888"
            className="input"
          />
        </div>
        <button type="submit" disabled={isPending} className="btn btn-primary w-full">
          {isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
