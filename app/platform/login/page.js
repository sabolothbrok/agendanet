import PhoneLoginForm from "@/components/PhoneLoginForm";
import { platformLoginAction } from "@/app/actions/auth";

export default function PlatformLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <PhoneLoginForm
        action={platformLoginAction}
        title="Admin general"
        subtitle="Gestiona tus negocios y crea nuevos desde aquí."
      />
    </div>
  );
}
