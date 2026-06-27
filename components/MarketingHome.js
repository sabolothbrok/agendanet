import Link from "next/link";
import IndustriesSection from "@/components/IndustriesSection";
import LandingNav from "@/components/LandingNav";
import {
  Bell,
  Building2,
  Calendar,
  Check,
  Shield,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: Building2,
    title: "Multi-negocio",
    text: "Varios locales en una cuenta: uñas, barbería, lavacar y más.",
  },
  {
    icon: Calendar,
    title: "Calendario por estaciones",
    text: "Disponibilidad en tiempo real. Bloquea horarios o cancela citas al instante.",
  },
  {
    icon: Users,
    title: "Clientes e invitaciones",
    text: "Enlaces seguros, clientes premium e historial de reservas.",
  },
  {
    icon: Bell,
    title: "Notificaciones",
    text: "Avisos de reservas y cancelaciones sin SMS ni correo.",
  },
  {
    icon: Smartphone,
    title: "Listo para móvil",
    text: "Tus clientes reservan en segundos desde el teléfono.",
  },
  {
    icon: Shield,
    title: "Roles claros",
    text: "Admin general, admin de negocio y cliente, cada uno con su vista.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Crea tu negocio",
    text: "Regístrate, define horarios, estaciones y servicios.",
  },
  {
    n: 2,
    title: "Invita clientes",
    text: "Comparte un enlace. Ellos se registran con su teléfono.",
  },
  {
    n: 3,
    title: "Recibe reservas",
    text: "El calendario se actualiza solo. Tú gestionas desde el panel.",
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
      "Admins general y locales",
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
      <Check className="landing-check-icon" strokeWidth={2.5} />
      {children}
    </li>
  );
}

function AdminSlot({ type, label }) {
  const className =
    type === "booked"
      ? "slot-cell slot-cell-booked slot-booked landing-slot-mini"
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
        <div className="landing-browser-url">agendanet.app/b/demo-unas/admin</div>
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
          <div className="landing-phone-header">
            <p className="landing-phone-brand">Demo Uñas</p>
            <p className="landing-phone-title">Reservar cita</p>
          </div>
          <div className="landing-phone-body">
            <div className="landing-phone-date">
              <span className="landing-phone-date-label">Fecha</span>
              <span className="landing-phone-date-value">Martes, 24 de junio</span>
            </div>

            <div className="landing-phone-hours">
              <div className="landing-phone-hour card">
                <p className="landing-phone-hour-label">10:00 a. m.</p>
                <p className="landing-phone-hour-station">Estación 2</p>
                <div className="slot-cell slot-selected landing-slot-mini">Disponible</div>
              </div>
              <div className="landing-phone-hour card">
                <p className="landing-phone-hour-label">10:30 a. m.</p>
                <p className="landing-phone-hour-station">Estación 1</p>
                <div className="slot-cell slot-booked landing-slot-mini">Reservado</div>
              </div>
            </div>

            <div className="landing-phone-services">
              <p className="landing-phone-services-label">Servicios</p>
              {[
                { name: "Manicure gel", meta: "60 min" },
                { name: "Nail art", meta: "30 min" },
              ].map((s) => (
                <div key={s.name} className="landing-phone-service">
                  <span className="landing-phone-service-name">
                    <input type="checkbox" checked disabled aria-hidden tabIndex={-1} />
                    {s.name}
                  </span>
                  <span className="landing-phone-service-meta">{s.meta}</span>
                </div>
              ))}
            </div>

            <span className="btn btn-primary landing-phone-cta" aria-hidden="true">
              Confirmar reserva
            </span>
          </div>
          <div className="landing-phone-tabbar" aria-hidden>
            <span className="landing-phone-tab landing-phone-tab--active">Reservar</span>
            <span className="landing-phone-tab">Mis reservas</span>
          </div>
          <div className="landing-phone-home" aria-hidden />
        </div>
        <div className="landing-phone-island" aria-hidden />
      </div>
    </div>
  );
}

function AdminPreview() {
  return (
    <BrowserPreview>
      <div className="landing-admin-inner">
        <div className="landing-admin-toolbar">
          <div>
            <p className="landing-admin-toolbar-label">Demo Uñas</p>
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

export default function MarketingHome({ businesses = [] }) {
  return (
    <div className="landing">
      <LandingNav />

      <section className="landing-hero">
        <div className="landing-container landing-hero-inner">
          <p className="landing-pill">
            <Sparkles className="h-4 w-4" />
            Plataforma de citas para pequeños negocios
          </p>
          <h1 className="landing-h1">
            Reservas online para todos tus negocios, en un solo lugar
          </h1>
          <p className="landing-hero-text">
            Centraliza calendarios, clientes y notificaciones. Tus clientes reservan desde
            el celular; tú controlas todo desde un panel web claro y profesional.
          </p>
          <div className="landing-hero-btns">
            <Link href="#demo" className="landing-btn-primary landing-btn-lg">
              Probar demo
            </Link>
            <Link href="#precios" className="landing-btn-secondary landing-btn-lg">
              Ver precios
            </Link>
          </div>
          <ul className="landing-hero-trust">
            {["Sin tarjeta de crédito", "Configuración en minutos", "Precios en colones"].map(
              (item) => (
                <li key={item}>
                  <Check className="landing-check-icon" strokeWidth={2.5} />
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
      </section>

      <section id="experiencia-web" className="landing-container landing-pad">
        <ExperienceSection
          tag="Panel web"
          title="Gestiona tu negocio desde el navegador"
          desc="Calendario completo por estaciones, citas del día y notificaciones. Ideal en computadora o tablet."
          items={[
            "Vista por estaciones con disponibilidad en tiempo real",
            "Cancela citas y bloquea horarios en un clic",
            "Inicio con citas del día y avisos internos",
            "Multi-negocio: cambia de local sin salir de la plataforma",
          ]}
          visual={<AdminPreview />}
          cta={{ href: "/b/demo-unas/admin/login", label: "Probar panel admin" }}
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
          title="Todo para dejar el papel atrás"
          desc="Simple para ti y para tus clientes."
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
          tag="Cómo funciona"
          title="De la invitación a la reserva en tres pasos"
          desc="Un flujo claro para empezar el mismo día."
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
            title="Planes claros, sin comisiones"
            desc="Ejemplos mensuales en colones. Sin cobro por cita."
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
                    <Check className="landing-check-icon" strokeWidth={2.5} />
                    {p}
                  </li>
                ))}
                </ul>
                <Link
                  href="/platform/login"
                  className={plan.featured ? "landing-btn-primary w-full" : "landing-btn-secondary w-full"}
                >
                  Empezar
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="landing-container landing-pad">
        <SectionHead
          tag="Demo"
          title="Pruébalo en vivo"
          desc="Accesos de demostración y negocios de esta instancia."
        />
        <div className="landing-demo">
          <div className="card p-6">
            <p className="font-semibold text-gray-900">Accesos rápidos</p>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>
                Admin general:{" "}
                <Link href="/platform/login" className="font-medium text-gray-900 underline">
                  /platform/login
                </Link>{" "}
                · 77770000
              </li>
              <li>
                Admin demo:{" "}
                <Link href="/b/demo-unas/admin/login" className="font-medium text-gray-900 underline">
                  demo-unas
                </Link>{" "}
                · 88880000
              </li>
              <li>
                Cliente demo:{" "}
                <Link href="/b/demo-unas/app/login" className="font-medium text-gray-900 underline">
                  /b/demo-unas/app/login
                </Link>{" "}
                · 66660000
              </li>
            </ul>
          </div>
          {businesses.length > 0 && (
            <div className="card p-6">
              <p className="font-semibold text-gray-900">Negocios activos</p>
              <ul className="mt-4 space-y-3">
                {businesses.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-col gap-2 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {b.business_type_label || b.business_type}
                      </p>
                      <p className="font-medium text-gray-900">{b.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/b/${b.slug}/app/login`} className="landing-btn-ghost text-xs">
                        Cliente
                      </Link>
                      <Link href={`/b/${b.slug}/admin/login`} className="landing-btn-primary text-xs !px-3 !py-2">
                        Admin
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-container landing-cta-inner">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Empieza a recibir reservas hoy
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-300">
            Configura tu primer negocio en minutos. Sin apps que descargar.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/platform/login" className="landing-btn-cta-solid">
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container py-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} AgendaNet · Plataforma multi-negocio de citas
        </div>
      </footer>
    </div>
  );
}
