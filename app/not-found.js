import Link from "next/link";
import AppIcon from "@/components/AppIcon";

export const metadata = {
  title: "Página no encontrada",
};

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-24 text-center">
      <AppIcon className="h-12 w-12 shrink-0" />
      <p className="mt-6 text-sm font-semibold tracking-wide text-[var(--brand)]">Error 404</p>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100 sm:text-3xl">
        No encontramos esta página
      </h1>
      <p className="mt-3 max-w-sm text-sm text-gray-600 dark:text-gray-400">
        El enlace puede estar mal escrito o la página ya no existe. Verifica la dirección o vuelve al inicio.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        Volver al inicio
      </Link>
    </div>
  );
}
