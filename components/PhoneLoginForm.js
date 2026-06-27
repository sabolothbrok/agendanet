"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import LoginFooter from "@/components/LoginFooter";
import LoginSessionResume from "@/components/LoginSessionResume";
import LoginStatusToast from "@/components/LoginStatusToast";
import {
  getSessionContinueHref,
  getSessionContinueLabel,
  getSessionContextLabel,
} from "@/lib/login-session";

export default function PhoneLoginForm({
  slug,
  action,
  title,
  subtitle,
  formKey,
  activeSession,
  logoutHref,
  businessName,
  loggedOut,
  expired,
  showBrand = true,
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const toast = useToast();

  const continueHref = activeSession ? getSessionContinueHref(activeSession) : null;
  const continueLabel = activeSession ? getSessionContinueLabel(activeSession) : "Continuar";
  const sessionContext = activeSession
    ? getSessionContextLabel(activeSession, businessName || title)
    : "";

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.target);
    startTransition(async () => {
      try {
        const res = slug !== undefined ? await action(slug, fd) : await action(fd);
        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
        }
      } catch (err) {
        unstable_rethrow(err);
        const message = "No se pudo iniciar sesión. Intenta de nuevo.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <div className="auth-card">
      <header className="auth-card-header">
        {showBrand && (
          <Link href="/" className="auth-brand" aria-label="AgendaNet — inicio">
            <span className="auth-brand-mark">
              <Calendar className="h-5 w-5" aria-hidden />
            </span>
            <span className="auth-brand-name">AgendaNet</span>
          </Link>
        )}
        <h1 className="auth-title">{activeSession ? "Sesión activa" : title}</h1>
        <p className="auth-subtitle">
          {activeSession
            ? "Puedes continuar con esta cuenta o cerrar sesión para entrar con otra."
            : subtitle}
        </p>
      </header>

      <LoginStatusToast
        loggedOut={loggedOut}
        expired={expired}
        activeSession={activeSession}
      />

      {activeSession ? (
        <LoginSessionResume
          name={activeSession.name}
          phone={activeSession.phone}
          context={sessionContext}
          continueHref={continueHref}
          continueLabel={continueLabel}
          logoutHref={logoutHref}
        />
      ) : (
        <>
          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <form key={formKey} onSubmit={handleSubmit} className="auth-form">
            <div>
              <label htmlFor="phone-login" className="auth-label">Teléfono</label>
              <input
                id="phone-login"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="8888-8888"
                className="input auth-input"
              />
            </div>
            <p className="auth-hint">
              Usa el teléfono registrado en este negocio (tuyo o de quien ya fue invitado).
            </p>
            <button type="submit" disabled={isPending} className="btn btn-primary auth-submit">
              {isPending ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </>
      )}

      <LoginFooter />
    </div>
  );
}
