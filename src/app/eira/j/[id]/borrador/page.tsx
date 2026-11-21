import { VistaBorrador } from "@/vistas/carta";

export const dynamic = "force-dynamic";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VistaBorrador rol="eira" id={id} />;
}
