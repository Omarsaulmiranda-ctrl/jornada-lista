import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Este cliente usa la llave secreta y solo existe en el servidor.
// El navegador nunca habla con la base de datos: las tablas tienen RLS sin políticas.

export const BUCKET = "evidencias";

let cliente: SupabaseClient | null = null;

export function baseConfigurada(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export function db(): SupabaseClient {
  if (!baseConfigurada()) {
    throw new Error(
      "Faltan SUPABASE_URL y SUPABASE_SECRET_KEY. Copie .env.example a .env.local y complételo.",
    );
  }
  cliente ??= createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cliente;
}
