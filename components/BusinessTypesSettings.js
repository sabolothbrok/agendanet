"use client";

import { useState, useTransition } from "react";
import {
  platformAddBusinessType,
  platformDeleteBusinessType,
  platformUpdateBusinessType,
} from "@/app/actions/platform";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";

export default function BusinessTypesSettings({ types: initial }) {
  const [types, setTypes] = useState(initial);
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  function addType(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    startTransition(async () => {
      const res = await platformAddBusinessType(fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setTypes((list) => [...list, res.type]);
      setLabel("");
      e.target.reset();
      toast.success("Tipo de negocio agregado.");
    });
  }

  function startEdit(type) {
    setEditingId(type.id);
    setEditLabel(type.label);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel("");
  }

  function saveEdit(id) {
    startTransition(async () => {
      const res = await platformUpdateBusinessType(id, editLabel);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setTypes((list) =>
        list.map((t) => (t.id === id ? { ...t, label: editLabel.trim() } : t))
      );
      setEditingId(null);
      toast.success("Nombre actualizado.");
    });
  }

  async function remove(type) {
    const ok = await confirm({
      title: "Eliminar tipo",
      message: `¿Eliminar "${type.label}"? Solo se puede si ningún negocio lo usa.`,
      confirmLabel: "Eliminar",
      cancelLabel: "Volver",
    });
    if (!ok) return;

    startTransition(async () => {
      const res = await platformDeleteBusinessType(type.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setTypes((list) => list.filter((t) => t.id !== type.id));
      toast.success("Tipo eliminado.");
    });
  }

  return (
    <div className="card space-y-4 p-4 sm:p-6">
      {dialog}
      <div>
        <h2 className="font-semibold text-gray-900">Tipos de negocio</h2>
        <p className="mt-1 text-sm text-gray-600">
          Opciones disponibles al crear un negocio. Puedes agregar las que necesites
          (spa, veterinaria, gimnasio, etc.).
        </p>
      </div>

      <form onSubmit={addType} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-gray-600">Nuevo tipo</label>
          <input
            name="label"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input"
            placeholder="Ej. Spa, Veterinaria, Gimnasio"
          />
        </div>
        <button type="submit" disabled={isPending} className="btn btn-primary w-full sm:w-auto">
          Agregar
        </button>
      </form>

      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
        {types.map((type) => (
          <li key={type.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            {editingId === type.id ? (
              <>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="input sm:max-w-xs"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(type.id)}
                    disabled={isPending}
                    className="btn btn-primary text-sm"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn btn-secondary text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="font-medium text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500">{type.slug}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(type)}
                    className="text-sm text-gray-700 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(type)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {types.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-500">
            Agrega al menos un tipo de negocio.
          </li>
        )}
      </ul>
    </div>
  );
}
