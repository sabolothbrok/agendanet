"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import AppIcon from "@/components/AppIcon";
import LoginFooter from "@/components/LoginFooter";
import LoginSessionResume from "@/components/LoginSessionResume";
import Spinner from "@/components/Spinner";
import { useCleanLoginUrl } from "@/hooks/useCleanLoginUrl";
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
  requiresPassword = false,
}) {
  const notice = useCleanLoginUrl(loggedOut, expired);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [step, setStep] = useState("phone"); // "phone" | "password" | "setup"
  const [phone, setPhone] = useState("");

  const continueHref = activeSession ? getSessionContinueHref(activeSession) : null;
  const continueLabel = activeSession ? getSessionContinueLabel(activeSession) : "Continuar";
  const sessionContext = activeSession
    ? getSessionContextLabel(activeSession, businessName || title)
    : "";

  function reset() {
    setStep("phone");
    setPhone("");
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.target);
    if (step === "phone") setPhone(String(fd.get("phone") || ""));

    startTransition(async () => {
      try {
        const res = slug !== undefined ? await action(slug, fd) : await action(fd);
        if (res?.needsSetup) {
          setStep("setup");
          if (res.error) setError(res.error);
          return;
        }
        if (res?.needsPassword) {
          setStep("password");
          if (res.error) setError(res.error);
          return;
        }
        if (res?.error) {
          setError(res.error);
        }
      } catch (err) {
        unstable_rethrow(err);
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
      }
    });
  }

  return (
    <div className="auth-card">
      <header className="auth-card-header">
        {showBrand && (
          <Link href="/" className="auth-brand" aria-label="AgendaNet — inicio">
            <AppIcon className="h-9 w-9 shrink-0" />
            <span className="auth-brand-name">AgendaNet</span>
          </Link>
        )}
        <h1 className="auth-title">
          {activeSession ? "Sesión activa" : step === "setup" ? "Crea tu contraseña" : title}
        </h1>
        <p className="auth-subtitle">
          {activeSession
            ? "Puedes continuar con esta cuenta o cerrar sesión para entrar con otra."
            : step === "setup"
              ? "Es la primera vez que entras con este teléfono. Crea una contraseña para proteger esta cuenta."
              : step === "password"
                ? "Ingresa tu contraseña para continuar."
                : subtitle}
        </p>
      </header>

      {!activeSession &&
        (error ? (
          <p className="auth-error" role="alert">{error}</p>
        ) : notice.loggedOut && !isPending && step === "phone" ? (
          <p
            className={`auth-notice ${notice.expired ? "auth-notice-warn" : ""}`}
            role="status"
          >
            {notice.expired
              ? "Tu sesión expiró por inactividad. Inicia sesión de nuevo."
              : "Sesión cerrada correctamente."}
          </p>
        ) : null)}

      {activeSession ? (
        <LoginSessionResume
          name={activeSession.name}
          phone={activeSession.phone}
          context={sessionContext}
          continueHref={continueHref}
          continueLabel={continueLabel}
          logoutHref={logoutHref}
        />
      ) : step === "phone" ? (
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
            {!requiresPassword
              ? "Usa el teléfono registrado en este negocio (tuyo o de quien ya fue invitado)."
              : slug !== undefined
                ? "Usa el teléfono registrado como administrador de este negocio."
                : "Usa tu teléfono y contraseña de administrador."}
          </p>
          <button type="submit" disabled={isPending} className="btn btn-primary auth-submit">
            {isPending && <Spinner />}
            {isPending ? "Entrando..." : requiresPassword ? "Continuar" : "Entrar"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <input type="hidden" name="phone" value={phone} />
          <div>
            <label className="auth-label">Teléfono</label>
            <input
              type="text"
              readOnly
              value={phone}
              className="input auth-input bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            />
          </div>
          {step === "setup" ? (
            <>
              <div>
                <label htmlFor="new-password" className="auth-label">Nueva contraseña</label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  autoFocus
                  className="input auth-input"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="auth-label">Confirma tu contraseña</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input auth-input"
                />
              </div>
              <p className="auth-hint">Al menos 8 caracteres.</p>
            </>
          ) : (
            <div>
              <label htmlFor="password-login" className="auth-label">Contraseña</label>
              <input
                id="password-login"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                autoFocus
                className="input auth-input"
              />
            </div>
          )}
          <button type="submit" disabled={isPending} className="btn btn-primary auth-submit">
            {isPending && <Spinner />}
            {isPending ? "Entrando..." : step === "setup" ? "Crear contraseña y entrar" : "Entrar"}
          </button>
          <button type="button" onClick={reset} className="auth-back-link">
            ← Usar otro teléfono
          </button>
        </form>
      )}

      <LoginFooter />
    </div>
  );
}
