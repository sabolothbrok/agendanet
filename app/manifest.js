export default function manifest() {
  return {
    name: "AgendaNet — Citas online para tu negocio",
    short_name: "AgendaNet",
    description: "Reserva y administra citas: calendario, clientes y equipo en un solo lugar.",
    start_url: "/login",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
