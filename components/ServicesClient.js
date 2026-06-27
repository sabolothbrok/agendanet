"use client";

import { useRef, useState, useTransition } from "react";
import { adminDeleteService, adminSaveService } from "@/app/actions/admin";
import { formatOptionalPrice } from "@/lib/utils";
import { useConfirm } from "@/hooks/useConfirm";

const emptyForm = {
  id: "",
  name: "",
  duration_minutes: "",
  price: "",
  is_premium: false,
  is_active: true,
};

function setSpanishValidity(event) {
  const field = event.target;
  if (field.validity.valid) {
    field.setCustomValidity("");
    return;
  }
  if (field.validity.valueMissing) {
    field.setCustomValidity("Completa este campo.");
  } else if (field.validity.rangeUnderflow) {
    if (field.name === "duration_minutes") {
      field.setCustomValidity("La duración mínima es 5 minutos.");
    } else {
      field.setCustomValidity("El precio no puede ser negativo.");
    }
  } else if (field.validity.badInput) {
    field.setCustomValidity("Ingresa un número válido.");
  } else {
    field.setCustomValidity("Valor no válido.");
  }
}

function clearValidity(event) {
  event.target.setCustomValidity("");
}

export default function ServicesClient({ slug, services: initial }) {
  const [services, setServices] = useState(initial);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef(null);
  const formSectionRef = useRef(null);
  const { confirm, dialog } = useConfirm();

  const isEditing = Boolean(form.id);

  function resetForm() {
    setForm(emptyForm);
    formRef.current?.reset();
  }

  function startEdit(service) {
    setForm({
      id: service.id,
      name: service.name,
      duration_minutes: String(service.duration_minutes),
      price: Number(service.price) > 0 ? String(service.price) : "",
      is_premium: service.is_premium,
      is_active: service.is_active,
    });
    setMessage("");
    setError("");
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    const fd = new FormData(e.target);
    if (form.id) fd.set("id", form.id);
    if (!form.is_premium) fd.delete("is_premium");
    if (!form.is_active) fd.set("is_active", "off");
    if (!form.price) fd.set("price", "0");

    startTransition(async () => {
      const res = await adminSaveService(slug, fd);
      if (res.error) {
        setError(res.error);
        return;
      }

      const saved = {
        id: form.id || crypto.randomUUID(),
        name: form.name,
        duration_minutes: Number(form.duration_minutes),
        price: form.price === "" ? 0 : Number(form.price),
        is_premium: form.is_premium,
        is_active: form.is_active,
      };

      if (isEditing) {
        setServices((list) => list.map((s) => (s.id === saved.id ? { ...s, ...saved } : s)));
        setMessage("Servicio actualizado.");
      } else {
        window.location.reload();
        return;
      }
      resetForm();
    });
  }

  async function remove(service) {
    const ok = await confirm({
      title: "Eliminar servicio",
      message: service.is_active
        ? `¿Eliminar "${service.name}"? Si tiene citas asociadas se desactivará en lugar de borrarse.`
        : `¿Quitar "${service.name}" de la lista?`,
      confirmLabel: "Eliminar",
      cancelLabel: "Volver",
    });
    if (!ok) return;
    setMessage("");
    setError("");
    startTransition(async () => {
      const res = await adminDeleteService(slug, service.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.deactivated) {
        setServices((list) =>
          list.map((s) => (s.id === service.id ? { ...s, is_active: false } : s))
        );
        setMessage(`"${service.name}" se desactivó porque tiene citas asociadas.`);
      } else {
        setServices((list) => list.filter((s) => s.id !== service.id));
        setMessage("Servicio eliminado.");
      }
      if (form.id === service.id) resetForm();
    });
  }

  return (
    <div className="space-y-6">
      {dialog}
      <div ref={formSectionRef} className="card p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900">
          {isEditing ? "Editar servicio" : "Agregar servicio"}
        </h2>
        <form ref={formRef} onSubmit={submit} className="mt-4 space-y-3">
          <input
            name="name"
            placeholder="Nombre"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onInvalid={setSpanishValidity}
            onInput={clearValidity}
            className="input"
          />
          <input
            name="duration_minutes"
            type="number"
            min="5"
            placeholder="Duración (min)"
            required
            value={form.duration_minutes}
            onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
            onInvalid={setSpanishValidity}
            onInput={clearValidity}
            className="input"
          />
          <input
            name="price"
            type="number"
            min="0"
            placeholder="Precio (₡, opcional)"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            onInvalid={setSpanishValidity}
            onInput={clearValidity}
            className="input"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              name="is_premium"
              checked={form.is_premium}
              onChange={(e) => setForm((f) => ({ ...f, is_premium: e.target.checked }))}
            />
            Servicio premium (solo clientes premium)
          </label>
          {isEditing && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Activo (visible para reservas)
            </label>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" disabled={isPending} className="btn btn-primary w-full sm:w-auto">
              {isEditing ? "Guardar cambios" : "Agregar servicio"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary w-full sm:w-auto"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {services.map((s) => (
          <div key={s.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500">
                  {s.duration_minutes} min · {formatOptionalPrice(s.price)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {s.is_premium && <span className="badge badge-warning">Premium</span>}
                <span className={`badge ${s.is_active ? "badge-success" : "badge-neutral"}`}>
                  {s.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(s)}
                className="btn btn-secondary flex-1 text-sm"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => remove(s)}
                className="btn btn-danger flex-1 text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <p className="card p-8 text-center text-gray-500">Sin servicios.</p>
        )}
      </div>

      {/* Desktop */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Servicio</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Duración</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Precio</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-b border-gray-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  {s.is_premium && <span className="badge badge-warning mt-1">Premium</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{s.duration_minutes} min</td>
                <td className="px-4 py-3 text-gray-600">{formatOptionalPrice(s.price)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${s.is_active ? "badge-success" : "badge-neutral"}`}>
                    {s.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => startEdit(s)}
                    className="text-sm text-gray-700 hover:underline"
                  >
                    Editar
                  </button>
                  <span className="mx-2 text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => remove(s)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && (
          <p className="p-8 text-center text-gray-500">Sin servicios.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}
