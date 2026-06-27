import Link from "next/link";
import { formatPhone } from "@/lib/utils";

function displayName(name, phone) {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  if (phone) return formatPhone(phone);
  return "Usuario";
}

function avatarLetter(name, phone) {
  const source = name?.trim() || phone || "?";
  return source.charAt(0).toUpperCase();
}

export default function LoginSessionResume({
  name,
  phone,
  context,
  continueHref,
  continueLabel,
  logoutHref,
}) {
  return (
    <div className="auth-session-card">
      <div className="auth-session-user">
        <span className="auth-session-avatar" aria-hidden>
          {avatarLetter(name, phone)}
        </span>
        <div className="auth-session-meta">
          <p className="auth-session-name">{displayName(name, phone)}</p>
          {phone && name?.trim() && (
            <p className="auth-session-phone">{formatPhone(phone)}</p>
          )}
          {context && <p className="auth-session-context">{context}</p>}
        </div>
      </div>

      {continueHref && (
        <Link href={continueHref} className="btn btn-primary auth-session-continue">
          {continueLabel || "Continuar"}
        </Link>
      )}

      {logoutHref && (
        <Link href={logoutHref} className="auth-session-logout">
          Cerrar sesión
        </Link>
      )}
    </div>
  );
}
