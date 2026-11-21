import { redirect } from "next/navigation";
import { iniciarSesionMunicipio } from "@/app/acciones";

// Enlace privado del municipio: es lo que EIRA envía por WhatsApp.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ok = await iniciarSesionMunicipio(token.slice(0, 100));
  redirect(ok ? "/municipio" : "/?error=enlace");
}
