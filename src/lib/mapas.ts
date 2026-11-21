// Enlace a Google Maps a partir de coordenadas (mismo formato que usa el CRM).
export const enlaceMaps = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
