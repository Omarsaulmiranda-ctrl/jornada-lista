-- Ubicación de la jornada: colonia o localidad real y sus coordenadas (dentro de México).
alter table public.jornadas
  add column colonia text,
  add column ubicacion text,
  add column lat double precision check (lat between 14 and 33),
  add column lng double precision check (lng between -119 and -86);
