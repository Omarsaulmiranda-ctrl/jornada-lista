# Jornada Lista

**El expediente compartido entre EIRA y cada municipio.** Una jornada de salud no se confirma hasta que lo crítico está aprobado, y siempre se ve quién debe qué.

Prototipo para el **Reto 2 (Coordinación institucional, cartas compromiso y documentación)** de EIRA Movimiento Rosa A.C., construido el 21 de noviembre de 2026 en la Vibeathon México de Nerdearla.

- **Demo en vivo:** https://jornada-lista.vercel.app
- **Video (2 minutos):** _pendiente_

> **Jornadas y personas ficticias, lugares reales.** El sistema no pide ni guarda datos de pacientes. Todas las jornadas, los enlaces municipales y sus teléfonos son inventados. El mapa usa localidades y colonias reales del sur de Jalisco (datos públicos de OpenStreetMap); que un municipio real aparezca en la demo no significa que tenga una jornada con EIRA. «Villa Ejemplo» es el municipio ficticio del caso oficial de la guía; su jornada se ubica en una localidad real al crearla.

## Probarlo en un minuto

Abra la demo. No hay contraseñas: la portada tiene un botón por cada papel.

| Papel | Cómo entrar |
| --- | --- |
| Coordinación de EIRA | Botón «Entrar como EIRA» |
| Enlace municipal de Villa Ejemplo | Botón «Entrar como Villa Ejemplo», o el enlace privado `/m/demo-villa-ejemplo` |
| Otros municipios de ejemplo | Botones de Sayula, Gómez Farías y Tapalpa |

Para ver las dos partes a la vez, abra EIRA en una ventana normal y el municipio en una ventana de incógnito. Las pantallas se actualizan solas cada pocos segundos.

En el tablero de EIRA, el enlace «Reiniciar datos de demostración» borra todo y vuelve a cargar los municipios de ejemplo.

## Qué problema resuelve

Hoy EIRA prepara cada jornada con Excel o Google Sheets. Pide a cada municipio una carta compromiso, fotografías del espacio, logotipo, persona enlace y apoyo en la convocatoria. Según la guía de EIRA, el principal problema son los retrasos, y es difícil saber «quién debe entregar qué y en qué fecha».

Jornada Lista convierte esa hoja de cálculo en un expediente que ven las dos partes. Los estados usan las palabras de la guía: **pendiente, recibido, observado, aprobado**.

## Flujo demostrado: el caso «Villa Ejemplo» de la guía

1. **EIRA crea la jornada** en Villa Ejemplo y elige qué requisitos pide y cuáles son críticos.
2. **El enlace municipal recibe su lista de requisitos**, llena los datos de la carta compromiso y sube fotografías del espacio desde el celular.
3. **EIRA observa que falta una imagen** y pide la corrección. El motivo es obligatorio.
4. **El municipio la adjunta** como versión 2. La versión 1 se conserva en el historial.
5. **EIRA aprueba.** Cuando todo lo crítico está aprobado, la jornada pasa a «Lista para confirmar» y EIRA da la confirmación final.
6. **El tablero** muestra, por municipio, qué está completo y qué impide avanzar, y a quién le toca.

### Cómo se probó

- El flujo completo, de crear la jornada a confirmarla, se recorrió en un navegador de escritorio contra la base de datos real.
- En la demo pública se probaron el reinicio de datos, la creación de la jornada, la entrada del enlace municipal y la subida de fotos.
- El equipo lo probó además desde un teléfono celular.
- No hay pruebas automatizadas.

## Implementado y simulado

| Pieza | Estado | Detalle |
| --- | --- | --- |
| Expediente por jornada (municipio, sede, fecha, servicios, responsables, aliado) | **Implementado** | |
| Lista de requisitos configurable, con «crítico» y fecha límite por requisito | **Implementado** | Se elige al crear la jornada. El catálogo base vive en `src/lib/plantillas.ts` |
| Carga de documentos con versiones | **Implementado** | Cada entrega es una versión nueva; la base de datos impide modificar una anterior |
| Revisión de EIRA: aprobar o pedir corrección | **Implementado** | La base de datos rechaza una observación sin motivo |
| Carta compromiso desde plantilla, con cláusulas fijas | **Implementado** | El municipio solo llena campos. Se imprime o se guarda como PDF desde el navegador |
| Sello de integridad de la carta | **Implementado** | Guarda la huella SHA-256 de las cláusulas y avisa si la plantilla cambió |
| Tablero por municipio con semáforo y «qué impide confirmar» | **Implementado** | El semáforo se calcula con los requisitos críticos y las fechas límite |
| Mapa interactivo de jornadas | **Implementado** | Un punto por jornada, con el color de su semáforo, qué impide confirmar y enlace al expediente |
| Ubicación en lugares reales | **Implementado** | Al crear la jornada se busca la localidad o colonia, se afina el punto tocando el mapa y se consultan las colonias de un código postal |
| Confirmación final de la jornada por EIRA | **Implementado** | Solo se habilita con todo lo crítico aprobado |
| Bitácora de movimientos | **Implementado** | Solo admite inserciones |
| Archivos privados | **Implementado** | Bucket privado; se ven con enlaces firmados de 10 minutos |
| Aviso al enlace municipal | **Parcial** | Se genera el mensaje con lo que falta y el motivo, y se abre en WhatsApp. EIRA decide cuándo enviarlo |
| Recordatorios automáticos programados | **Simulado** | No se envía nada por sí solo |
| Inicio de sesión de EIRA | **Simulado** | Botón de demo sin contraseña |
| Acceso del municipio | **Parcial** | El mecanismo de enlace privado funciona; los enlaces de la demo son públicos a propósito |
| Texto de la carta | **De ejemplo** | La plantilla oficial de EIRA no estaba entre los materiales publicados |
| Uso sin conexión | **No implementado** | Ver «Conectividad» |
| Firma electrónica, exportación a CSV, edición del catálogo desde la pantalla | **No implementado** | |

## Límites que respeta el prototipo

- La carta generada **no equivale a firma ni a aprobación jurídica**. Lo dice la propia carta. EIRA conserva la validación institucional final.
- Las cláusulas protegidas **no se pueden alterar** desde la aplicación: no viajan desde el navegador, se toman de la plantilla en el servidor.
- Se **registran las versiones** de todos los documentos.
- **No hay datos reales** ni datos de pacientes.

## Cómo levantarlo

Requisitos: Node.js 20.9 o superior y un proyecto de Supabase (el plan gratuito basta).

```bash
npm install
cp .env.example .env.local   # complete los valores
npm run dev                  # http://localhost:3000
```

1. Cree un proyecto en [supabase.com](https://supabase.com).
2. Ejecute `supabase/migrations/0001_esquema.sql` y después `0002_ubicacion.sql` en el editor SQL del proyecto.
3. Copie la URL y la llave secreta (`sb_secret_...`) a `.env.local`.
4. Entre como EIRA y use «Reiniciar datos de demostración» para cargar los municipios de ejemplo.

### Credenciales y servicios

| Variable | Para qué |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto de Supabase |
| `SUPABASE_SECRET_KEY` | Llave secreta. Solo se usa en el servidor |
| `SESSION_SECRET` | Cadena aleatoria que firma la cookie de sesión |

El mapa usa tres servicios públicos que no requieren cuenta ni llave: los mosaicos de OpenStreetMap, el buscador Nominatim (OpenStreetMap) y Zippopotam (colonias por código postal, con datos de GeoNames).

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

- **Next.js 16 (App Router)** con Server Components y Server Actions. **React 19**, **TypeScript** y **Tailwind CSS 4**.
- **Supabase Postgres** con cinco tablas: `municipios`, `jornadas`, `requisitos`, `entregas` y `eventos`.
- **Supabase Storage** con un bucket privado (máximo 10 MB por archivo, solo imágenes y PDF).
- **Vercel** para el despliegue.
- **Leaflet** con mosaicos de OpenStreetMap para el mapa.
- Dependencias de ejecución: `next`, `react`, `react-dom`, `@supabase/supabase-js`, `leaflet` y `server-only`.

### Decisiones de diseño

- **El navegador nunca habla con la base de datos.** Todas las tablas tienen RLS activado y ninguna política, así que ninguna llave pública puede leer ni escribir. Solo entra el servidor, que comprueba el rol y el municipio en cada operación.
- **Las reglas viven en la base, no solo en la pantalla.** Una restricción impide guardar «observado» sin motivo. Un disparador impide modificar el contenido de una entrega: corregir es crear la versión siguiente. Otro impide editar la bitácora.
- **Los estados no se aceptan del navegador.** El servidor los calcula a partir de la acción realizada.
- **Las fotos se reducen en el celular antes de subirse** y van directo al almacén con un enlace firmado de carga. Pesan menos y llegan aunque la conexión sea mala.
- **Los requisitos y la carta son configuración** (`src/lib/plantillas.ts`). Cambiar esas listas adapta el sistema a otro programa o a otra organización.
- **El semáforo se calcula con los requisitos críticos**, no con el porcentaje general: un expediente casi completo al que le falta la carta sigue bloqueado.
- **La revisión es por requisito, no por archivo**, como en el caso de la guía («falta una imagen»).
- **El mapa no depende de catálogos propios.** Las coordenadas salen de OpenStreetMap y se guardan con la jornada. La cobertura de colonias en OpenStreetMap es desigual en municipios pequeños; por eso el punto se puede afinar tocando el mapa y el nombre de la colonia se puede escribir o tomar del código postal.
- **La carta es una página lista para imprimir.** No depende de Word ni de un generador de PDF en el servidor.

## Riesgos, seguridad, operación y costos

### Riesgos

| Riesgo | Mitigación propuesta |
| --- | --- |
| Quien tenga el enlace privado de un municipio puede entrar | En el piloto: enlaces aleatorios largos, con caducidad y revocables por EIRA; verificación por código al teléfono del enlace |
| El acceso de EIRA es un botón sin contraseña | Cuentas individuales con correo institucional antes de cualquier uso real |
| La carta se toma por un documento firmado | Leyenda visible en pantalla y en el impreso; la firma autógrafa se sube como un requisito aparte |
| Los municipios siguen respondiendo por WhatsApp y no usan el sistema | El aviso lleva el enlace directo; EIRA puede medir en la bitácora quién entra y quién no |
| Fotos con personas identificables | El requisito lo indica («sin personas»); EIRA puede observarlas. Falta una casilla de autorización |
| Los servicios públicos del mapa cambian sus condiciones o limitan el uso | El mapa es un complemento: el expediente funciona sin él. Para uso intensivo, contratar un proveedor de mosaicos y geocodificación |
| La organización depende de quien construyó el prototipo | Código abierto, cuentas a nombre de EIRA, Postgres estándar exportable |

### Seguridad

- Hecho: llave secreta solo en el servidor, RLS sin políticas, bucket privado, enlaces firmados de vida corta, cookie de sesión firmada y `httpOnly`, validación de tipo y tamaño de archivo, permisos por municipio en cada operación.
- Falta para un piloto: autenticación real, límite de intentos, caducidad de enlaces, revisión de seguridad independiente, política de conservación y eliminación de documentos, y aviso de privacidad para los datos de contacto de los enlaces municipales.

### Operación

- **Quién lo administra:** una persona de la coordinación de EIRA. Crea jornadas, revisa entregas y edita el catálogo de requisitos.
- **Capacitación:** una sesión corta para EIRA. El enlace municipal no necesita capacitación: abre un enlace y sigue una lista de tareas.
- **Respaldos:** el plan gratuito de Supabase no incluye respaldos automáticos; el plan de pago sí. Los archivos deben respaldarse aparte.
- **Incidencias:** hoy no hay monitoreo ni alertas. Hace falta una persona técnica de contacto.

### Costos

Cifras aproximadas a noviembre de 2026; deben verificarse en las páginas de precios.

| Etapa | Costo mensual | Notas |
| --- | --- | --- |
| Demostración | USD 0 | Planes gratuitos de Vercel y Supabase. Supabase pausa el proyecto tras una semana sin uso |
| Piloto | Alrededor de USD 25 a 45 | Supabase de pago (sin pausas, con respaldos) y, si el uso deja de ser no comercial, Vercel de pago |

No hay costo por mensajes: el aviso se abre en el WhatsApp de la persona de EIRA.

## Requisitos transversales de la guía de EIRA

- **Accesibilidad:** la vista municipal está pensada para celular. Letra grande, tareas nombradas con verbos, cuatro estados dichos con texto y no solo con color, y trato de «usted».
- **Conectividad:** el prototipo necesita internet. Las fotos se comprimen antes de subir para que funcionen con mala señal, y si una carga falla no se registra nada a medias. No hay modo sin conexión ni sincronización; para la preparación de una jornada, que se hace desde oficinas municipales, lo consideramos aceptable, pero debe validarse con EIRA.
- **Privacidad:** datos mínimos (nombre, cargo y teléfono del enlace municipal), ningún dato de pacientes, permisos por municipio, archivos sin enlaces públicos y bitácora de movimientos.
- **Operación:** ver la sección anterior.
- **Sostenibilidad:** seis dependencias de ejecución, todas de código abierto. Dos servicios contratados (Vercel y Supabase), ambos sustituibles, y tres servicios públicos gratuitos para el mapa, cuyas condiciones de uso limitan el volumen de consultas: la aplicación es Next.js estándar y la base es Postgres estándar.
- **Interoperabilidad:** la carta se guarda como PDF desde el navegador y los datos están en Postgres, exportables con herramientas estándar. La exportación a CSV desde la pantalla no está hecha.

## Próximos pasos para un piloto

1. Sustituir la plantilla de ejemplo por la carta oficial de EIRA y confirmar qué cláusulas son fijas.
2. Autenticación real para EIRA y enlaces municipales con caducidad y revocación.
3. Probar con una jornada real en un municipio, en paralelo con la hoja de cálculo actual.
4. Recordatorios programados, con la frecuencia y el destinatario que EIRA defina.
5. Edición del catálogo de requisitos desde la pantalla y exportación a CSV.
6. Revisión de privacidad y seguridad, respaldos y acuerdo de mantenimiento.

## Preguntas abiertas y supuestos para EIRA

Supuestos que tomamos y deben validarse:

- Los requisitos críticos son la carta compromiso, las fotografías del espacio y la persona enlace; el logotipo y el apoyo a la convocatoria pueden llegar después.
- Las fechas límite se calculan hacia atrás desde la fecha de la jornada (entre 7 y 21 días antes).
- Un solo enlace por municipio entrega todo.
- La preparación de la jornada se hace con conexión a internet.

Preguntas:

1. ¿Qué campos de la carta compromiso se llenan automáticamente y qué cláusulas son inalterables?
2. ¿Qué documentos son obligatorios para confirmar una jornada y cuáles pueden entregarse después?
3. ¿Qué recordatorios son útiles, quién debe recibirlos y por qué canal?
4. ¿Quién firma por el municipio y se requiere acuerdo de cabildo?
5. ¿Qué pasa con lo ya aprobado si cambia la fecha o la sede?
6. ¿Los aliados o patrocinadores también entregan documentos?

## Cómo lo construimos

Con Claude Code como agente de programación. Primero se analizó la guía de EIRA y se escribió el plan; después el agente escribió el código, creó la base de datos y probó el caso «Villa Ejemplo» de punta a punta en el navegador antes de desplegar.

## Licencia

[MIT](LICENSE). EIRA Movimiento Rosa A.C. y Nerdearla pueden usar, adaptar y desplegar esta solución.
