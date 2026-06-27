import UniversalLoginForm from "@/components/UniversalLoginForm";
import { universalLoginAction } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <UniversalLoginForm action={universalLoginAction} />
    </div>
  );
}
