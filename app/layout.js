import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Plataforma multi-negocio de reservas con calendario, clientes y paneles admin.";

export const metadata = {
  metadataBase: new URL("https://agendanet.vercel.app"),
  title: {
    default: "AgendaNet — Citas online para tu negocio",
    template: "%s · AgendaNet",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "AgendaNet — Citas online para tu negocio",
    description: DESCRIPTION,
    url: "/",
    siteName: "AgendaNet",
    locale: "es",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgendaNet — Citas online para tu negocio",
    description: DESCRIPTION,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full overflow-x-hidden bg-[var(--bg)] font-sans">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <NextTopLoader color="#0f766e" height={3} showSpinner={false} shadow={false} />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
