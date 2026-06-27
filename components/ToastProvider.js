"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const clearDismissTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const dismiss = useCallback(
    (id) => {
      setToast((current) => {
        if (id != null && current?.id !== id) return current;
        clearDismissTimer();
        return null;
      });
    },
    [clearDismissTimer]
  );

  const show = useCallback(
    (message, type = "success") => {
      if (!message) return;
      clearDismissTimer();
      const id = crypto.randomUUID();
      setToast({ id, message, type });
      timeoutRef.current = window.setTimeout(() => dismiss(id), 3500);
    },
    [clearDismissTimer, dismiss]
  );

  useEffect(() => () => clearDismissTimer(), [clearDismissTimer]);

  const value = useMemo(
    () => ({
      show,
      success: (message) => show(message, "success"),
      error: (message) => show(message, "error"),
      info: (message) => show(message, "info"),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toast && (() => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
              <Icon className="toast-icon" aria-hidden />
              <p className="toast-message">{toast.message}</p>
              <button
                type="button"
                className="toast-close"
                onClick={() => dismiss(toast.id)}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })()}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
}
