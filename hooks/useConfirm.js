"use client";

import { useCallback, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

export function useConfirm() {
  const [config, setConfig] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfig({ ...options, resolve });
    });
  }, []);

  const close = useCallback((result) => {
    setConfig((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  const dialog = config ? (
    <ConfirmDialog
      open
      title={config.title}
      message={config.message}
      confirmLabel={config.confirmLabel}
      cancelLabel={config.cancelLabel}
      variant={config.variant}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;

  return { confirm, dialog };
}
