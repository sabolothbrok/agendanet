"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  CalendarCheck,
  Car,
  Check,
  ChevronLeft,
  Clock,
  Flower2,
  List,
  PhoneOff,
  Scissors,
  Sparkles,
  X,
} from "lucide-react";
import LandingPhoneFrame from "@/components/LandingPhoneFrame";

const INDUSTRIES = [
  {
    id: "nails",
    icon: Sparkles,
    label: "Uñas",
    examples: "Manicure, gel, nail art",
    business: "Salón Bella",
    customer: "María",
    spaces: ["Estación 1", "Estación 2"],
    date: "2026-06-24",
    chat: [
      { from: "in", text: "¿Tienes espacio mañana a las 3 para gel?" },
      { from: "out", text: "Creo que sí, te confirmo…" },
      { from: "in", text: "¿Y el viernes?" },
    ],
    paper: [
      { text: "15:00 María", strike: true },
      { text: "15:00 Ana (?)", strike: false },
      { text: "16:30 ???", strike: true },
    ],
    rows: [
      { time: "14:00", cells: ["booked", "free"] },
      { time: "14:45", cells: ["free", "sel"] },
    ],
    toast: "Nueva reserva · Estación 2",
  },
  {
    id: "barber",
    icon: Scissors,
    label: "Barbería",
    examples: "Corte, barba, fade",
    business: "Barbería Norte",
    customer: "Carlos",
    spaces: ["Silla 1", "Silla 2"],
    date: "2026-06-24",
    chat: [
      { from: "in", text: "¿Me puedes para un fade a las 11?" },
      { from: "out", text: "Déjame ver el cuaderno…" },
      { from: "in", text: "¿O a las 12?" },
    ],
    paper: [
      { text: "11:00 Carlos", strike: true },
      { text: "11:00 Luis (?)", strike: false },
      { text: "12:30 ???", strike: true },
    ],
    rows: [
      { time: "11:00", cells: ["booked", "free"] },
      { time: "11:30", cells: ["free", "sel"] },
    ],
    toast: "Nueva reserva · Silla 2",
  },
  {
    id: "carwash",
    icon: Car,
    label: "Lavacar",
    examples: "Básico, premium, detailing",
    business: "AutoShine",
    customer: "Andrea",
    spaces: ["Bahía 1", "Bahía 2"],
    date: "2026-06-24",
    chat: [
      { from: "in", text: "¿Tienen bahía para detailing a las 2?" },
      { from: "out", text: "Creo que la 3 está libre…" },
      { from: "in", text: "Confírmame porfa" },
    ],
    paper: [
      { text: "14:00 SUV", strike: true },
      { text: "14:00 sedan (?)", strike: false },
      { text: "15:00 ???", strike: true },
    ],
    rows: [
      { time: "14:00", cells: ["booked", "free"] },
      { time: "14:30", cells: ["free", "sel"] },
    ],
    toast: "Nueva reserva · Bahía 2",
  },
  {
    id: "spa",
    icon: Flower2,
    label: "Spa y más",
    examples: "Masajes, faciales, depilación",
    business: "Spa Luna",
    customer: "Elena",
    spaces: ["Cabina 1", "Cabina 2"],
    date: "2026-06-24",
    chat: [
      { from: "in", text: "¿Hay cabina para masaje a las 4?" },
      { from: "out", text: "Te aviso en un rato" },
      { from: "in", text: "¿90 minutos?" },
    ],
    paper: [
      { text: "16:00 facial", strike: true },
      { text: "16:00 masaje (?)", strike: false },
      { text: "17:30 ???", strike: true },
    ],
    rows: [
      { time: "15:30", cells: ["booked", "free"] },
      { time: "16:00", cells: ["free", "sel"] },
    ],
    toast: "Nueva reserva · Cabina 2",
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
  { icon: PhoneOff, value: "24/7", label: "reservas sin llamadas" },
];

function slotClass(type) {
  if (type === "booked") return "slot-cell slot-booked landing-slot-mini";
  if (type === "sel") return "slot-cell slot-selected landing-slot-mini";
  return "slot-cell slot-available landing-slot-mini";
}

function slotLabel(type) {
  if (type === "booked") return "Reservado";
  if (type === "sel") return "Tu cita";
  return "Disponible";
}

function ChaosPhone({ active }) {
  return (
    <LandingPhoneFrame compact>
      <div className="landing-imessage">
        <header className="landing-imessage-header">
          <span className="landing-imessage-back" aria-hidden>
            <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
            48
          </span>
          <div className="landing-imessage-person">
            <span className="landing-imessage-avatar">{active.customer.slice(0, 1)}</span>
            <span className="landing-imessage-name">{active.customer}</span>
          </div>
          <span className="landing-imessage-back landing-imessage-back--spacer" aria-hidden>
            48
          </span>
        </header>
        <div className="landing-imessage-thread">
          <p className="landing-imessage-stamp">Hoy 9:12</p>
          {active.chat.map((msg) => (
            <div
              key={msg.text}
              className={`landing-imessage-bubble landing-imessage-bubble--${msg.from}`}
            >
              {msg.text}
            </div>
          ))}
          <div className="landing-imessage-note">
            <p className="landing-imessage-note-title">Notas · agenda</p>
            {active.paper.map((line) => (
              <span
                key={line.text}
                className={
                  line.strike
                    ? "landing-imessage-note-line landing-imessage-note-line--strike"
                    : "landing-imessage-note-line"
                }
              >
                {line.text}
              </span>
            ))}
          </div>
        </div>
        <div className="landing-imessage-composer" aria-hidden>
          <span className="landing-imessage-field">Mensaje</span>
          <span className="landing-imessage-send" />
        </div>
      </div>
    </LandingPhoneFrame>
  );
}

function AgendaPhone({ active }) {
  return (
    <LandingPhoneFrame compact>
      <header className="landing-phone-app-header">
        <div className="min-w-0">
          <p className="landing-phone-business">{active.business}</p>
          <p className="landing-phone-user">{active.customer}</p>
          <p className="landing-phone-phone">6666-0000</p>
        </div>
      </header>
      <div className="landing-phone-scroll">
        <h2 className="landing-phone-page-title">Reservar cita</h2>
        <p className="landing-phone-page-desc">
          Elige un espacio disponible en el calendario
        </p>
        <div className="landing-phone-date-row">
          <label className="landing-phone-field-label">Fecha</label>
          <div className="landing-phone-date-input">{active.date}</div>
        </div>
        {active.rows.map((row) => (
          <div key={row.time} className="landing-phone-slot-card card">
            <p className="landing-phone-slot-time">{row.time}</p>
            <div className="landing-phone-slot-grid">
              {row.cells.map((cell, i) => (
                <div key={`${row.time}-${active.spaces[i]}`} className="landing-phone-slot-item">
                  <p className="landing-phone-station">{active.spaces[i]}</p>
                  <div className={slotClass(cell)}>{slotLabel(cell)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="landing-compare-toast" aria-hidden>
        {active.toast}
      </div>
      <nav className="landing-phone-tabbar" aria-hidden>
        <span className="landing-phone-tab landing-phone-tab--active">
          <Calendar className="h-4 w-4" strokeWidth={2.25} />
          Reservar
        </span>
        <span className="landing-phone-tab">
          <List className="h-4 w-4" strokeWidth={1.75} />
          Reservas
        </span>
      </nav>
    </LandingPhoneFrame>
  );
}

export default function IndustriesSection() {
  const [activeId, setActiveId] = useState(INDUSTRIES[0].id);
  const active = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0];

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

        <div className="landing-industries-picker">
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
        </div>

        <div className="landing-compare">
          <div className="landing-compare-col">
            <span className="landing-compare-badge landing-compare-badge--muted">Sin sistema</span>
            <ChaosPhone active={active} />
            <ul className="landing-compare-list">
              {PAIN_POINTS.map((item) => (
                <li key={item}>
                  <X className="landing-compare-list-icon landing-compare-list-icon--bad" strokeWidth={2.5} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-compare-divider" aria-hidden>
            <span className="landing-compare-vs-spacer" />
            <span>vs</span>
          </div>

          <div className="landing-compare-col landing-compare-col--after">
            <span className="landing-compare-badge landing-compare-badge--accent">Con AgendaNet</span>
            <AgendaPhone active={active} />
            <ul className="landing-compare-list">
              {BENEFITS.map((item) => (
                <li key={item}>
                  <Check className="landing-compare-list-icon landing-compare-list-icon--good" strokeWidth={2.5} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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

        <div className="landing-industries-cta-wrap">
          <Link href="#precios" className="landing-btn-primary landing-industries-cta">
            Ver planes para tu negocio
          </Link>
        </div>
      </div>
    </section>
  );
}
