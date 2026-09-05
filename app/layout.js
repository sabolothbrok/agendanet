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

export const metadata = {
  title: "AgendaNet",
  description: "Plataforma de citas para pequeños negocios",
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
