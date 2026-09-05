import CreateBusinessForm from "@/components/CreateBusinessForm";
import { listBusinessTypes } from "@/lib/queries";

export default async function NewBusinessPage() {
  const businessTypes = await listBusinessTypes();

  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">Nuevo negocio</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
        Configura el negocio y su administrador local.
      </p>

      <div className="mt-6">
        <CreateBusinessForm businessTypes={businessTypes} />
      </div>
    </>
  );
}
