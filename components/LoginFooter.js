import Link from "next/link";

export default function LoginFooter() {
  return (
    <footer className="auth-footer">
      <Link href="/" className="auth-back-link">
        Volver al sitio
      </Link>
    </footer>
  );
}
