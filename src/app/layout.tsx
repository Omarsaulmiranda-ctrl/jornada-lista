import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jornada Lista",
  description:
    "Expediente compartido entre EIRA y cada municipio para preparar jornadas de salud. Prototipo con datos ficticios.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="pie relative z-10 border-t border-borde px-4 py-4 text-center text-sm text-tenue">
          Prototipo de demostración · Jornadas y personas ficticias · No contiene datos de pacientes · Vibeathon
          México 2026, Reto 2 de EIRA Movimiento Rosa A.C.
        </footer>
      </body>
    </html>
  );
}
