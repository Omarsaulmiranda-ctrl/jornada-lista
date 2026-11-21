import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c, Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const redonda = M_PLUS_Rounded_1c({
  variable: "--font-redonda",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Jornada Lista · EIRA",
  description:
    "Expediente compartido entre EIRA y cada municipio para preparar jornadas de salud. Prototipo con datos ficticios.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7d3b3b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${montserrat.variable} ${redonda.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="no-imprimir mt-10 border-t border-borde bg-superficie px-4 py-5 text-center text-sm text-tenue">
          Prototipo con datos ficticios · No contiene datos de pacientes · Vibeathon México 2026,
          Reto 2 de EIRA Movimiento Rosa A.C.
        </footer>
      </body>
    </html>
  );
}
