"use client";

export default function ErrorFallback({ reset, title = "Algo salió mal" }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">
        Intenta de nuevo. Si el problema continúa, recarga la página o vuelve a iniciar sesión.
      </p>
      {typeof reset === "function" && (
        <button type="button" onClick={reset} className="btn btn-primary mt-6">
          Reintentar
        </button>
      )}
    </div>
  );
}
