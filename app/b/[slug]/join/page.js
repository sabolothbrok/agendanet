import { redirect } from "next/navigation";
import JoinForm from "@/components/JoinForm";
import { getInviteByToken } from "@/lib/queries";

export default async function JoinPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const token = sp?.token;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-gray-600">Enlace de invitación inválido.</p>
      </div>
    );
  }

  const invite = await getInviteByToken(token);
  if (!invite || invite.slug !== slug) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-gray-600">Este enlace no es válido o expiró.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <JoinForm slug={slug} token={token} businessName={invite.business_name} />
    </div>
  );
}
