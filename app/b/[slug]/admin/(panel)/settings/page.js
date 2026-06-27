import AdminShell from "@/components/AdminShell";
import SpacesSettings from "@/components/SpacesSettings";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";
import { adminSaveSettings } from "@/app/actions/admin";
import { listSpaces } from "@/lib/queries";

export const dynamic = "force-dynamic";

function Toggle({ name, label, defaultChecked }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-4 py-3 text-sm">
      <span className="text-gray-700">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-5 w-5" />
    </label>
  );
}

export default async function AdminSettingsPage({ params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);
  const b = auth.business;
  const spaces = await listSpaces(b.id);

  return (
    <AdminShell
      slug={slug}
      businessName={b.name}
      current="/settings"
      isPlatformAdmin={auth.isPlatformAdmin}
    >
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Configuración</h1>
      <p className="mt-1 text-sm text-gray-600 sm:text-base">
        Estaciones, reglas de citas y notificaciones internas
      </p>

      <div className="mt-6 max-w-xl">
        <SpacesSettings slug={slug} spaces={spaces} />
      </div>

      <form action={adminSaveSettings.bind(null, slug)} className="mt-6 max-w-xl space-y-6">
        <div className="card space-y-4 p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900">Citas</h2>
          <div>
            <label className="mb-1 block text-sm text-gray-600">
              Horas mínimas antes para que el cliente modifique
            </label>
            <input
              name="min_modify_hours"
              type="number"
              defaultValue={b.min_modify_hours}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">
              Duración mínima de cita (minutos)
            </label>
            <input
              name="min_appointment_minutes"
              type="number"
              defaultValue={b.min_appointment_minutes}
              className="input"
            />
          </div>
          <Toggle
            name="show_services_list"
            label="Mostrar lista de servicios a clientes"
            defaultChecked={b.show_services_list}
          />
        </div>

        <div className="card space-y-3 p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900">Notificaciones (internas)</h2>
          <Toggle
            name="reminders_enabled"
            label="Recordatorios de cita para clientes"
            defaultChecked={b.reminders_enabled}
          />
          <Toggle
            name="notify_new_booking"
            label="Aviso al crear reserva"
            defaultChecked={b.notify_new_booking}
          />
          <Toggle
            name="notify_cancel_booking"
            label="Aviso al cancelar reserva"
            defaultChecked={b.notify_cancel_booking}
          />
          <Toggle
            name="notify_inactive_enabled"
            label="Aviso si cliente lleva tiempo sin cita"
            defaultChecked={b.notify_inactive_enabled}
          />
          <div>
            <label className="mb-1 block text-sm text-gray-600">Días sin cita para avisar</label>
            <input
              name="notify_inactive_days"
              type="number"
              defaultValue={b.notify_inactive_days}
              className="input"
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full sm:w-auto">
          Guardar configuración
        </button>
      </form>
    </AdminShell>
  );
}
