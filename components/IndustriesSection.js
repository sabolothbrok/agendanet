"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  CalendarCheck,
  Car,
  Check,
  Clock,
  MessageSquare,
  Scissors,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";

const INDUSTRIES = [
  {
    id: "nails",
    icon: Sparkles,
    label: "Uñas",
    examples: "Manicure, gel, nail art",
    scenario: "Salón con 3 estaciones y citas cada 45 min",
  },
  {
    id: "barber",
    icon: Scissors,
    label: "Barbería",
    examples: "Corte, barba, fade",
    scenario: "2 barberos con agenda compartida por silla",
  },
  {
    id: "carwash",
    icon: Car,
    label: "Lavacar",
    examples: "Básico, premium, detailing",
    scenario: "4 bahías con turnos de 30 a 60 minutos",
  },
  {
    id: "spa",
    icon: Building2,
    label: "Spa y más",
    examples: "Masajes, faciales, depilación",
    scenario: "Varias cabinas y servicios de distinta duración",
  },
];

const PAIN_POINTS = [
  "Dobles reservas y huecos vacíos",
  "Mensajes perdidos en WhatsApp",
  "Horas coordinando por teléfono",
  "Sin historial ni recordatorios",
];

const BENEFITS = [
  "Calendario único por estación",
  "Clientes reservan solos, 24/7",
  "Notificaciones al instante",
  "Historial y control en un panel",
];

const STATS = [
  { icon: Clock, value: "−3 h", label: "menos coordinación al día" },
  { icon: CalendarCheck, value: "0", label: "dobles reservas" },
  { icon: Smartphone, value: "24/7", label: "reservas sin llamadas" },
];

function CompareVisual({ active }) {
  return (
    <div className="landing-compare-wrap">
      <div className="landing-compare">
      <div className="landing-compare-panel landing-compare-panel--before">
        <span className="landing-compare-badge landing-compare-badge--muted">Sin sistema</span>
        <div className="landing-compare-chaos" aria-hidden>
          <div className="landing-compare-chat">
            <div className="landing-compare-bubble landing-compare-bubble--in">
              ¿Tienes espacio mañana a las 3?
            </div>
            <div className="landing-compare-bubble landing-compare-bubble--out">
              Creo que sí, te confirmo…
            </div>
            <div className="landing-compare-bubble landing-compare-bubble--in">
              ¿Y el viernes?
            </div>
          </div>
          <div className="landing-compare-paper">
            <span className="landing-compare-paper-line landing-compare-paper-line--strike">
              3:00 María
            </span>
            <span className="landing-compare-paper-line">3:00 Ana (?)</span>
            <span className="landing-compare-paper-line landing-compare-paper-line--strike">
              4:30 ???
            </span>
          </div>
        </div>
        <ul className="landing-compare-list">
          {PAIN_POINTS.map((item) => (
            <li key={item}>
              <X className="landing-compare-list-icon landing-compare-list-icon--bad" strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="landing-compare-divider landing-compare-divider--desktop" aria-hidden>
        <span>vs</span>
      </div>

      <div className="landing-compare-panel landing-compare-panel--after">
        <span className="landing-compare-badge landing-compare-badge--accent">Con AgendaNet</span>
        <div className="landing-compare-order" aria-hidden>
          <p className="landing-compare-order-title">{active.label}</p>
          <p className="landing-compare-order-sub">{active.scenario}</p>
          <div className="landing-compare-mini-cal">
            {["9:00", "9:30", "10:00", "10:30"].map((time, i) => (
              <div key={time} className="landing-compare-mini-row">
                <span className="landing-compare-mini-time">{time}</span>
                <span
                  className={`landing-compare-mini-slot ${
                    i === 0
                      ? "landing-compare-mini-slot--booked"
                      : i === 1
                        ? "landing-compare-mini-slot--selected"
                        : "landing-compare-mini-slot--free"
                  }`}
                >
                  {i === 0 ? "Reservado" : i === 1 ? "Tu cita" : "Disponible"}
                </span>
              </div>
            ))}
          </div>
          <div className="landing-compare-toast">
            <MessageSquare className="h-3.5 w-3.5" />
            Nueva reserva · Estación 2
          </div>
        </div>
        <ul className="landing-compare-list">
          {BENEFITS.map((item) => (
            <li key={item}>
              <Check className="landing-compare-list-icon landing-compare-list-icon--good" strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
}

export default function IndustriesSection() {
  const [activeId, setActiveId] = useState(INDUSTRIES[0].id);
  const active = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0];
  const ActiveIcon = active.icon;

  return (
    <section className="landing-band">
      <div className="landing-container landing-pad">
        <div className="landing-head">
          <p className="landing-tag">Industrias</p>
          <h2 className="landing-h2">Para cualquier negocio con citas</h2>
          <p className="landing-lead landing-lead--industries">
            Deja el cuaderno y el WhatsApp: un calendario digital te devuelve tiempo y
            tranquilidad.
          </p>
        </div>

        <div className="landing-industries-layout">
          <CompareVisual active={active} />

          <div className="landing-industries-side">
            <p className="landing-industries-prompt">¿Cuál es tu negocio?</p>
            <div className="landing-industries-grid" role="group" aria-label="Tipo de negocio">
              {INDUSTRIES.map(({ id, icon: Icon, label, examples }) => {
                const isActive = id === activeId;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`landing-industry-btn ${isActive ? "landing-industry-btn--active" : ""}`}
                    aria-pressed={isActive}
                    onClick={() => setActiveId(id)}
                  >
                    <span className="landing-industry-btn-icon" aria-hidden>
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="landing-industry-btn-text">
                      <span className="landing-industry-btn-label">{label}</span>
                      <span className="landing-industry-btn-examples">{examples}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="landing-industry-preview card">
              <span className="landing-industry-preview-icon" aria-hidden>
                <ActiveIcon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="landing-industry-preview-title">Ejemplo: {active.label}</p>
                <p className="landing-industry-preview-text">{active.scenario}</p>
              </div>
            </div>

            <Link href="#precios" className="landing-btn-primary landing-industries-cta">
              Ver planes para tu negocio
            </Link>
          </div>
        </div>

        <div className="landing-industries-stats">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="landing-industry-stat">
              <span className="landing-industry-stat-icon" aria-hidden>
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="landing-industry-stat-body">
                <p className="landing-industry-stat-value">{value}</p>
                <p className="landing-industry-stat-label">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
