import { VistaExpediente } from "@/vistas/expediente";

export const dynamic = "force-dynamic";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VistaExpediente rol="municipio" id={id} />;
}
