import Link from "next/link";
import IndustriesSection from "@/components/IndustriesSection";
import LandingNav from "@/components/LandingNav";
import WeeklyReportChart from "@/components/WeeklyReportChart";
import {
  Banknote,
  Bell,
  Building2,
  Calendar,
  ChartColumn,
  Check,
  ClipboardList,
  CreditCard,
  LayoutGrid,
  List,
  Timer,
  Users,
} from "lucide-react";

const HERO_PROOF = [
  { icon: CreditCard, text: "Sin tarjeta de crédito" },
  { icon: Timer, text: "Configuración en minutos" },
  { icon: Banknote, text: "Precios en colones" },
];

const HERO_WEEK = [
  { label: "Lun", value: 64, date: "demo-lun" },
  { label: "Mar", value: 72, date: "demo-mar" },
  { label: "Mié", value: 68, date: "demo-mie" },
  { label: "Jue", value: 81, date: "demo-jue" },
  { label: "Vie", value: 88, date: "demo-vie" },
  { label: "Sáb", value: 92, date: "demo-sab" },
  { label: "Dom", value: 45, date: "demo-dom" },
];

const HERO_KPIS = [
  { icon: LayoutGrid, value: "76%", label: "ocupación promedio de estaciones" },
  { icon: Timer, value: "12 min", label: "tiempo promedio de reserva" },
  { icon: Users, value: "En vivo", label: "calendario compartido por equipo" },
];

const FEATURES = [
  {
    icon: Building2,
    title: "Multi-negocio",
    text: "Varios locales en una sola cuenta. Cambia de sucursal sin cerrar sesión.",
  },
  {
    icon: Calendar,
    title: "Calendario por estaciones",
    text: "Cada bahía, silla o cabina en su columna. Disponibilidad actualizada al instante.",
  },
  {
    icon: ClipboardList,
    title: "Servicios con duración y precio",
    text: "Arma tu catálogo una vez. Cada reserva usa el tiempo correcto del servicio.",
  },
  {
    icon: Users,
    title: "Base de clientes",
    text: "Historial de visitas, clientes premium y control de quién puede reservar.",
  },
  {
    icon: Bell,
    title: "Notificaciones internas",
    text: "Avisos de reservas y cancelaciones dentro de la plataforma, sin correo ni SMS.",
  },
  {
    icon: ChartColumn,
    title: "Reporte semanal",
    text: "Ocupación por día y actividad de la semana para ajustar horarios y personal.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Arma tu perfil",
    text: "Horarios, estaciones y servicios desde el panel. Listo en minutos, sin tarjeta.",
  },
  {
    n: 2,
    title: "Comparte el enlace",
    text: "Mándalo por WhatsApp o donde prefieras. Tus clientes entran con su teléfono.",
  },
  {
    n: 3,
    title: "Recibe las reservas",
    text: "Cada cita aparece sola en el calendario. Tú confirmas, cancelas o bloqueas cuando haga falta.",
  },
];

const PLANS = [
  {
    name: "Esencial",
    price: "₡9,900",
    note: "Para un negocio que empieza.",
    featured: false,
    perks: ["1 negocio", "Hasta 3 estaciones", "Calendario y reservas", "Invitaciones", "Notificaciones"],
  },
  {
    name: "Profesional",
    price: "₡19,900",
    note: "Ideal para salones en crecimiento.",
    featured: true,
    perks: [
      "Hasta 5 negocios",
      "Estaciones ilimitadas",
      "Servicios con precio",
      "Historial de cancelaciones",
      "Configuración avanzada",
      "Soporte por chat",
    ],
  },
  {
    name: "Empresa",
    price: "₡39,900",
    note: "Para cadenas y franquicias.",
    featured: false,
    perks: [
      "Negocios ilimitados",
      "Administradores por sucursal",
      "Tipos de negocio custom",
      "Soporte prioritario",
      "Onboarding asistido",
    ],
  },
];

function SectionHead({ tag, title, desc, align = "center" }) {
  return (
    <div className={`landing-head ${align === "left" ? "landing-head--left" : ""}`}>
      {tag && <p className="landing-tag">{tag}</p>}
      <h2 className="landing-h2">{title}</h2>
      {desc && <p className="landing-lead">{desc}</p>}
    </div>
  );
}

function CheckItem({ children }) {
  return (
    <li>
      <Check className="landing-check-icon" strokeWidth={2.5} aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function AdminSlot({ type, label }) {
  const className =
    type === "booked"
      ? "slot-cell slot-cell-stack slot-booked landing-slot-mini"
      : type === "sel"
        ? "slot-cell slot-selected landing-slot-mini"
        : type === "block"
          ? "slot-cell slot-unavailable landing-slot-mini"
          : "slot-cell slot-available landing-slot-mini";

  return <div className={className}>{label}</div>;
}

function ExperienceSection({ tag, title, desc, items, visual, reverse = false, cta }) {
  return (
    <div className={`landing-experience ${reverse ? "landing-experience--reverse" : ""}`}>
      <div className="landing-experience-copy">
        <SectionHead tag={tag} title={title} desc={desc} align="left" />
        <ul className="landing-checklist">
          {items.map((item) => (
            <CheckItem key={item}>{item}</CheckItem>
          ))}
        </ul>
        {cta && (
          <Link href={cta.href} className="landing-btn-primary landing-experience-cta">
            {cta.label}
          </Link>
        )}
      </div>
      <div className="landing-experience-visual">{visual}</div>
    </div>
  );
}

function BrowserPreview({ children }) {
  return (
    <div className="landing-browser">
      <div className="landing-browser-bar">
        <span /><span /><span />
        <div className="landing-browser-url">agendanet.app/b/mi-salon/admin</div>
      </div>
      <div className="landing-browser-content">{children}</div>
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="landing-phone-device">
      <div className="landing-phone">
        <div className="landing-phone-screen">
          <header className="landing-phone-app-header">
            <div className="min-w-0">
              <p className="landing-phone-business">Demo Uñas</p>
              <p className="landing-phone-user">María</p>
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
              <div className="landing-phone-date-input">2026-06-24</div>
            </div>

            <div className="landing-phone-slot-card card">
              <p className="landing-phone-slot-time">10:00 a. m.</p>
              <div className="landing-phone-slot-grid">
                <div className="landing-phone-slot-item">
                  <p className="landing-phone-station">Estación 1</p>
                  <div className="slot-cell slot-booked landing-slot-mini">Reservado</div>
                </div>
                <div className="landing-phone-slot-item">
                  <p className="landing-phone-station">Estación 2</p>
                  <div className="slot-cell slot-selected landing-slot-mini">Disponible</div>
                </div>
              </div>
            </div>

            <div className="landing-phone-slot-card card">
              <p className="landing-phone-slot-time">10:30 a. m.</p>
              <div className="landing-phone-slot-grid">
                <div className="landing-phone-slot-item">
                  <p className="landing-phone-station">Estación 1</p>
                  <div className="slot-cell slot-available landing-slot-mini">Disponible</div>
                </div>
                <div className="landing-phone-slot-item">
                  <p className="landing-phone-station">Estación 2</p>
                  <div className="slot-cell slot-blocked slot-cell-stack landing-slot-mini">
                    <p className="font-medium text-gray-700">No disponible</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-phone-form card">
              <p className="landing-phone-form-title">Servicios</p>
              {[
                { name: "Manicure gel", meta: "60 min · ₡28,000", checked: true },
                { name: "Pedicure", meta: "60 min · ₡22,000", checked: false },
              ].map((s) => (
                <div key={s.name} className="landing-phone-service">
                  <span className="landing-phone-service-name">
                    <input type="checkbox" checked={s.checked} readOnly aria-hidden tabIndex={-1} />
                    {s.name}
                  </span>
                  <span className="landing-phone-service-meta">{s.meta}</span>
                </div>
              ))}

              <div className="landing-phone-summary">
                <p className="landing-phone-summary-title">Resumen</p>
                <p className="landing-phone-summary-line">martes, 24 de junio de 2026</p>
                <p className="landing-phone-summary-line">10:00 a. m. – 11:00 a. m. (60 min)</p>
              </div>

              <span className="btn btn-primary landing-phone-cta" aria-hidden="true">
                Confirmar reserva
              </span>
            </div>
          </div>

          <nav className="landing-phone-tabbar" aria-hidden>
            <span className="landing-phone-tab landing-phone-tab--active">
              <Calendar className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              Reservar
            </span>
            <span className="landing-phone-tab">
              <List className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Reservas
            </span>
          </nav>

          <div className="landing-phone-home" aria-hidden />
        </div>
        <div className="landing-phone-island" aria-hidden />
      </div>
    </div>
  );
}

function HeroGraphic() {
  return (
    <WeeklyReportChart
      variant="landing"
      eyebrow="Visibilidad operativa"
      title="Ocupación de estaciones en la semana"
      description="Con reservas en línea ves qué días llenan más tus estaciones y dónde aún hay capacidad disponible."
      days={HERO_WEEK}
      kpis={HERO_KPIS}
    />
  );
}

function AdminPreview() {
  return (
    <BrowserPreview>
      <div className="landing-admin-inner">
        <div className="landing-admin-toolbar">
          <div>
            <p className="landing-admin-toolbar-label">Salón Bella</p>
            <p className="landing-admin-toolbar-title">Calendario</p>
          </div>
          <span className="badge badge-neutral">3 citas hoy</span>
        </div>

        <p className="landing-admin-date">Martes, 24 de junio</p>

        <div className="landing-admin-table-wrap">
          <table className="landing-admin-table-grid">
            <thead>
              <tr>
                <th>Hora</th>
                {["Estación 1", "Estación 2", "Estación 3"].map((s) => (
                  <th key={s}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["9:00", "booked", "free", "free"],
                ["9:30", "block", "sel", "free"],
                ["10:00", "free", "free", "free"],
                ["10:30", "free", "booked", "free"],
              ].map(([hora, ...cells]) => (
                <tr key={hora}>
                  <td className="landing-admin-time">{hora}</td>
                  {cells.map((c, i) => (
                    <td key={`${hora}-${i}`}>
                      <AdminSlot
                        type={c}
                        label={
                          c === "booked"
                            ? "María G."
                            : c === "sel"
                              ? "Seleccionado"
                              : c === "block"
                                ? "No disp."
                                : "Disponible"
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="landing-admin-sidebar">
          <p className="landing-admin-sidebar-title">Hoy</p>
          <ul className="landing-admin-sidebar-list">
            <li>
              <span>9:00</span>
              <span>María G. · Est. 1</span>
            </li>
            <li>
              <span>10:30</span>
              <span>Ana R. · Est. 2</span>
            </li>
          </ul>
        </div>
      </div>
    </BrowserPreview>
  );
}

export default function MarketingHome() {
  return (
    <div className="landing">
      <LandingNav />

      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden />
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Software de reservas para negocios locales</p>
            <h1 className="landing-h1">
              Citas, calendario y clientes en una sola plataforma
            </h1>
            <p className="landing-hero-text">
              AgendaNet centraliza la operación de tus locales. Tus clientes reservan desde
              el celular; tú administras horarios, estaciones y equipo desde un panel claro.
            </p>
            <div className="landing-hero-btns">
              <Link href="#precios" className="landing-btn-primary landing-btn-lg">
                Ver planes
              </Link>
              <Link href="#funciones" className="landing-btn-secondary landing-btn-lg">
                Ver funciones
              </Link>
            </div>
            <ul className="landing-hero-proof">
              {HERO_PROOF.map(({ icon: Icon, text }) => (
                <li key={text} className="landing-hero-proof-item">
                  <span className="landing-hero-proof-icon" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="landing-hero-proof-text">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="landing-hero-visual">
            <HeroGraphic />
          </div>
        </div>
      </section>

      <section id="experiencia-web" className="landing-container landing-pad">
        <ExperienceSection
          tag="Panel web"
          title="Gestiona tu negocio desde el navegador"
          desc="Calendario completo por estaciones, citas del día y notificaciones. Ideal en computadora o tablet."
          items={[
            "Vista por estaciones con disponibilidad en tiempo real",
            "Cancela citas y bloquea horarios en un click",
            "Inicio con citas del día y avisos internos",
            "Multi-negocio: cambia de local sin salir de la plataforma",
          ]}
          visual={<AdminPreview />}
        />
      </section>

      <section id="experiencia-movil" className="landing-band">
        <div className="landing-container landing-pad">
          <ExperienceSection
            tag="App cliente"
            title="Tus clientes reservan desde el celular"
            desc="Calendario táctil, selección de estación y confirmación en pocos toques. Sin instalar nada."
            items={[
              "Vista optimizada para pantallas pequeñas",
              "Privacidad: otros ven «Reservado», ellos ven «Tu reserva»",
              "Historial con estado de cada cita",
              "Invitación por enlace y registro con teléfono",
            ]}
            visual={<PhonePreview />}
            reverse
          />
        </div>
      </section>

      <section id="funciones" className="landing-container landing-pad">
        <SectionHead
          tag="Funciones"
          title="Qué incluye la plataforma"
          desc="Capacidades para operar citas, clientes y varios locales sin herramientas extra."
        />
        <div className="landing-features">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="landing-feature card">
              <span className="landing-feature-icon">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="landing-band">
        <div className="landing-container landing-pad">
        <SectionHead
          tag="¿Cómo funciona?"
          title="Tres pasos para empezar hoy"
          desc="Configuras, compartes el enlace y recibes reservas el mismo día."
        />
        <ol className="landing-steps">
          {STEPS.map((step) => (
            <li key={step.n} className="landing-step card">
              <span className="landing-step-num" aria-hidden="true">
                {step.n}
              </span>
              <h3 className="landing-step-title">{step.title}</h3>
              <p className="landing-step-text">{step.text}</p>
            </li>
          ))}
        </ol>
        </div>
      </section>

      <IndustriesSection />

      <section id="precios" className="landing-band">
        <div className="landing-container landing-pad">
          <SectionHead
            tag="Precios"
            title="Planes transparentes, sin comisiones"
            desc="Tarifas mensuales en colones. Sin cobro por cita ni cargos ocultos."
          />
          <div className="landing-pricing">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={`landing-plan card ${plan.featured ? "landing-plan--featured" : ""}`}
              >
                {plan.featured && <span className="landing-plan-tag">Más popular</span>}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-3 text-4xl font-bold tracking-tight">{plan.price}</p>
                <p className="text-sm text-gray-500">/mes</p>
                <p className="mt-3 text-sm text-gray-600">{plan.note}</p>
                <ul className="landing-plan-list">
                {plan.perks.map((p) => (
                  <li key={p}>
                    <Check className="landing-check-icon" strokeWidth={2.5} aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-container landing-cta-inner">
          <p className="landing-cta-eyebrow">Listo para modernizar tus reservas</p>
          <h2 className="landing-cta-title">
            Menos mensajes. Menos errores. Más citas confirmadas.
          </h2>
          <p className="landing-cta-text">
            Unifica calendarios, clientes y notificaciones en una plataforma diseñada para
            negocios de servicios.
          </p>
          <div className="landing-cta-btns">
            <Link href="#precios" className="landing-btn-primary landing-btn-lg">
              Explorar planes
            </Link>
            <Link href="/login" className="landing-btn-secondary landing-btn-lg">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-footer-logo">
              <Calendar className="h-5 w-5" aria-hidden />
              <span>AgendaNet</span>
            </div>
            <p className="landing-footer-desc">
              Plataforma de reservas para salones, barberías, spas y negocios de servicios.
            </p>
          </div>
          <nav className="landing-footer-nav" aria-label="Secciones">
            <p className="landing-footer-nav-title">Producto</p>
            <a href="#funciones">Funciones</a>
            <a href="#como-funciona">¿Cómo funciona?</a>
            <a href="#precios">Precios</a>
          </nav>
        </div>
        <div className="landing-container landing-footer-bottom">
          <p>© {new Date().getFullYear()} AgendaNet. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
