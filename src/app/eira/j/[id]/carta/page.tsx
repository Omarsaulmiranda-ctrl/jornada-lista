import { VistaCarta } from "@/vistas/carta";

export const dynamic = "force-dynamic";

export default async function Pagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { id } = await params;
  const { v } = await searchParams;
  return <VistaCarta rol="eira" id={id} v={v} />;
}
