# Jornada Lista

**El expediente compartido entre EIRA y cada municipio.** Una jornada de salud no se confirma hasta que lo crítico está aprobado, y siempre se ve quién debe qué.

Prototipo para el **Reto 2 (Coordinación institucional, cartas compromiso y documentación)** de EIRA Movimiento Rosa A.C., construido el 21 de noviembre de 2026 en la Vibeathon México de Nerdearla.

> **Solo datos ficticios.** El sistema no pide ni guarda datos de pacientes. El municipio «Villa Ejemplo» y todas las personas que aparecen son inventados.

> **Estado: en construcción.** Este README se actualiza durante el día. La tabla «Implementado y simulado» refleja siempre lo que de verdad funciona.

- Demo en vivo: _pendiente_
- Video (2 minutos): _pendiente_

## Qué problema resuelve

Hoy EIRA prepara cada jornada con Excel o Google Sheets. Pide a cada municipio una carta compromiso, fotografías del espacio, logotipo, persona enlace y apoyo en la convocatoria. Según la guía de EIRA, el principal problema son los retrasos, y es difícil saber «quién debe entregar qué y en qué fecha».

Jornada Lista convierte esa hoja de cálculo en un expediente que ven las dos partes:

1. EIRA crea la jornada y elige los requisitos.
2. El enlace municipal ve su lista de tareas, llena la carta y sube sus documentos desde el celular.
3. EIRA aprueba o marca «observado» y explica el motivo.
4. El municipio corrige con una nueva versión; la anterior se conserva.
5. El tablero muestra qué está completo y qué impide confirmar.

Los estados usan las palabras de la guía de EIRA: **pendiente, recibido, observado, aprobado**.

## Cómo levantarlo

Requisitos: Node.js 20.9 o superior y un proyecto de Supabase (el plan gratuito basta).

```bash
npm install
cp .env.example .env.local   # complete los valores
npm run dev                  # http://localhost:3000
```

1. Cree un proyecto en [supabase.com](https://supabase.com).
2. Ejecute `supabase/migrations/0001_esquema.sql` en el editor SQL del proyecto.
3. Copie la URL y la llave secreta (`sb_secret_...`) a `.env.local`.

### Credenciales y servicios

| Variable | Para qué |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto de Supabase |
| `SUPABASE_SECRET_KEY` | Llave secreta. Solo se usa en el servidor |
| `SESSION_SECRET` | Firma la cookie de sesión |
| `EIRA_CLAVE_DEMO` | Contraseña de la coordinación de EIRA en la demo |

Accesos de demostración (ficticios): _pendiente_.

## Arquitectura

```
Navegador (EIRA o enlace municipal)
        │  HTTPS
        ▼
Next.js 16 en Vercel ── valida rol y municipio en cada operación
        │  llave secreta (solo servidor)
        ▼
Supabase: Postgres + Storage privado
```

- **Next.js 16 (App Router)**, con Server Components y Server Actions. No hay API pública aparte.
- **Supabase Postgres** con cinco tablas: `municipios`, `jornadas`, `requisitos`, `entregas` y `eventos`.
- **Supabase Storage** con un bucket privado. Los archivos se suben y se ven con enlaces firmados de vida corta.
- **Vercel** para el despliegue.

### Decisiones de diseño

- **El navegador nunca habla con la base de datos.** Todas las tablas tienen RLS activado y ninguna política, así que ninguna llave pública puede leer ni escribir. Solo entra el servidor, que comprueba el rol y el municipio.
- **Las reglas viven en la base, no solo en la pantalla.** No se puede guardar «observado» sin motivo. El contenido de una entrega no se puede modificar: corregir es crear la versión siguiente. La bitácora solo admite inserciones.
- **Los requisitos son configuración** (`src/lib/plantillas.ts`). Cambiar la lista adapta el sistema a otro programa o a otra organización.
- **El semáforo se calcula con los requisitos críticos**, no con el porcentaje general.
- **La carta se genera como una página lista para imprimir.** El municipio solo llena campos; las cláusulas de EIRA no tienen campo editable.

## Implementado y simulado

| Pieza | Estado |
| --- | --- |
| Esquema de datos con reglas de versiones, motivo obligatorio y bitácora | Implementado |
| Bucket privado para evidencias | Implementado |
| Crear jornada con requisitos | Pendiente |
| Carga de documentos con versiones | Pendiente |
| Revisión de EIRA (aprobar u observar con motivo) | Pendiente |
| Carta compromiso desde plantilla | Pendiente |
| Tablero de pendientes por municipio | Pendiente |
| Envío automático de recordatorios | Simulado |
| Inicio de sesión con correo o enlace mágico | Simulado |
| Firma electrónica | Fuera de alcance |

## Límites que respeta el prototipo

- La carta generada **no equivale a firma ni a aprobación jurídica**. EIRA conserva la validación institucional final.
- Las cláusulas protegidas no se pueden alterar desde la aplicación.
- La plantilla de carta es **de ejemplo**: la plantilla oficial de EIRA no estaba entre los materiales publicados.

## Riesgos, seguridad, operación y costos

_En redacción._

## Requisitos transversales de la guía de EIRA

_En redacción: accesibilidad, conectividad, privacidad, operación, sostenibilidad e interoperabilidad._

## Próximos pasos para un piloto

_En redacción._

## Preguntas abiertas y supuestos para EIRA

1. ¿Qué campos de la carta compromiso se llenan automáticamente y qué cláusulas son inalterables?
2. ¿Qué documentos son obligatorios para confirmar una jornada y cuáles pueden entregarse después?
3. ¿Qué recordatorios son útiles, quién debe recibirlos y por qué canal?
4. ¿Quién firma por el municipio y se requiere acuerdo de cabildo?
5. ¿Qué pasa con lo ya aprobado si cambia la fecha o la sede?

## Cómo lo construimos

Con Claude Code como agente de programación. Primero se escribió la especificación a partir de la guía de EIRA y después el código.

## Licencia

[MIT](LICENSE). EIRA Movimiento Rosa A.C. y Nerdearla pueden usar, adaptar y desplegar esta solución.
