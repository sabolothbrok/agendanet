import MarketingHome from "@/components/MarketingHome";
import { listBusinesses } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AgendaNet — Citas online para tu negocio",
  description: "Plataforma multi-negocio de reservas con calendario, clientes y paneles admin.",
};

export default async function HomePage() {
  let businesses = [];
  try {
    businesses = await listBusinesses();
  } catch {
    businesses = [];
  }

  return <MarketingHome businesses={businesses} />;
}
