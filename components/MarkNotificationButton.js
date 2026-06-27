"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminMarkRead } from "@/app/actions/admin";
import { useToast } from "@/hooks/useToast";

export default function MarkNotificationButton({ slug, notificationId }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleClick() {
    const fd = new FormData();
    fd.set("notificationId", notificationId);
    startTransition(async () => {
      const res = await adminMarkRead(slug, fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Notificación marcada como leída.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-gray-500 hover:underline disabled:opacity-50"
    >
      {isPending ? "Marcando..." : "Marcar leída"}
    </button>
  );
}
