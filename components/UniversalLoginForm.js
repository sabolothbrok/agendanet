"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { Building2, Calendar, Phone, Shield, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import LoginFooter from "@/components/LoginFooter";
import LoginSessionResume from "@/components/LoginSessionResume";
import {
  getSessionContinueHref,
  getSessionContinueLabel,
  getSessionContextLabel,
} from "@/lib/login-session";

const DESTINATION_ICONS = {
  platform_admin: Shield,
  admin: Building2,
  customer: Smartphone,
};

export default function UniversalLoginForm({
  action,
  formKey,
  activeSession,
  logoutHref,
  loggedOut,
  expired,
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const toast = useToast();
  const [phone, setPhone] = useState("");
  const [destinations, setDestinations] = useState(null);
  const [destination, setDestination] = useState("");

  const continueHref = activeSession ? getSessionContinueHref(activeSession) : null;
  const continueLabel = activeSession ? getSessionContinueLabel(activeSession) : "Continuar";
  const sessionContext = activeSession ? getSessionContextLabel(activeSession) : "";

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.target);
    const nextPhone = String(fd.get("phone") || "");
    setPhone(nextPhone);

    startTransition(async () => {
      try {
        const res = await action(fd);
        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
          return;
        }
        if (res?.destinations?.length) {
          setDestinations(res.destinations);
          setDestination(res.destinations[0].key);
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
        <Link href="/" className="auth-brand" aria-label="AgendaNet — inicio">
          <span className="auth-brand-mark">
            <Calendar className="h-5 w-5" aria-hidden />
          </span>
          <span className="auth-brand-name">AgendaNet</span>
        </Link>
        <h1 className="auth-title">
          {activeSession ? "Sesión activa" : "Iniciar sesión"}
        </h1>
        <p className="auth-subtitle">
          {activeSession
            ? "Puedes continuar con esta cuenta o cerrar sesión para entrar con otra."
            : "Ingresa tu teléfono y te llevamos al panel o app de tu negocio."}
        </p>
      </header>

      {loggedOut && !activeSession && (
        <p
          className={`auth-notice ${expired ? "auth-notice-warn" : ""}`}
          role="status"
        >
          {expired
            ? "Tu sesión expiró por inactividad. Inicia sesión de nuevo."
            : "Sesión cerrada correctamente."}
        </p>
      )}

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
              <label htmlFor="login-phone" className="auth-label">Teléfono</label>
              <div className="auth-input-wrap">
                <Phone className="auth-input-icon" aria-hidden />
                <input
                  id="login-phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setDestinations(null);
                    setDestination("");
                  }}
                  placeholder="8888-8888"
                  className="input auth-input"
                />
              </div>
            </div>

            {destinations?.length > 0 && (
              <input type="hidden" name="destination" value={destination} />
            )}

            {destinations?.length > 0 && (
              <fieldset className="auth-destinations">
                <legend className="auth-label">Elige dónde entrar</legend>
                <div className="auth-destination-list">
                  {destinations.map((item) => {
                    const Icon = DESTINATION_ICONS[item.role] || Building2;
                    const selected = destination === item.key;

                    return (
                      <label
                        key={item.key}
                        className={`auth-destination ${selected ? "auth-destination--active" : ""}`}
                      >
                        <input
                          type="radio"
                          value={item.key}
                          checked={selected}
                          onChange={() => setDestination(item.key)}
                          className="auth-destination-radio"
                        />
                        <span className="auth-destination-icon" aria-hidden>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="auth-destination-copy">
                          <span className="auth-destination-title">{item.title}</span>
                          <span className="auth-destination-subtitle">{item.subtitle}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <button type="submit" disabled={isPending} className="btn btn-primary auth-submit">
              {isPending ? "Entrando..." : destinations ? "Continuar" : "Entrar"}
            </button>
          </form>
        </>
      )}

      <LoginFooter />
    </div>
  );
}
