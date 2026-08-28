export default function LoadingFallback({ label = "Cargando…" }) {
  return (
    <div className="px-4 py-16 text-center text-sm text-gray-500" role="status">
      {label}
    </div>
  );
}
