"use client";

import { useTransition } from "react";
import { platformResetAdminPassword } from "@/app/actions/platform";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import Spinner from "@/components/Spinner";

export default function ResetAdminPasswordButton({ businessId, hasPassword }) {
  const [isPending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  async function handleReset() {
    const ok = await confirm({
      title: "Restablecer contraseña",
      message:
        "El administrador de este negocio deberá crear una nueva contraseña la próxima vez que inicie sesión con su teléfono.",
      confirmLabel: "Restablecer",
      cancelLabel: "Cancelar",
    });
    if (!ok) return;

    startTransition(async () => {
      const res = await platformResetAdminPassword(businessId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Contraseña restablecida.");
    });
  }

  if (!hasPassword) {
    return (
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        El administrador aún no ha creado su contraseña.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleReset}
        disabled={isPending}
        className="btn btn-secondary mt-2 w-full text-sm sm:w-auto"
      >
        {isPending && <Spinner />}
        {isPending ? "Restableciendo..." : "Restablecer contraseña"}
      </button>
      {dialog}
    </>
  );
}
