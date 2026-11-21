// La coordinación de EIRA trabaja en el tema oscuro de monitoreo. La vista municipal se queda clara:
// se usa en el celular, a veces a pleno sol, y ahí el contraste alto importa más.
export default function LayoutEira({ children }: { children: React.ReactNode }) {
  return <div className="tema-oscuro">{children}</div>;
}
