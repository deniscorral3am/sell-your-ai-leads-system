@AGENTS.md

# Sell Your AI Leads System · reglas para Claude

Panel de Sell Your AI para gente que no programa. Háblales en **español de España, de tú**, corto y sin tecnicismos. Cuando acabes un cambio, diles qué pantalla abrir para verlo.

## Qué es

Panel que corre **en el ordenador de la persona** (`npm run dev`, solo en 127.0.0.1:3000) y guarda los datos en **su** Supabase. No tiene login porque no sale de su ordenador: no añadas despliegue ni autenticación salvo que lo pida.

Stack: Next.js 16 (App Router), TypeScript, Tailwind v4, Supabase. WhatsApp con Baileys en un proceso aparte por número (`scripts/whatsapp-puente.mjs`).

## Mapa

| Dónde | Qué hay |
|---|---|
| `src/app/<pantalla>/page.tsx` | Una carpeta por pantalla del menú |
| `src/app/conexiones/<id>/page.tsx` | Guías paso a paso de cada conexión |
| `src/acciones/*.ts` | Acciones del servidor: todo lo que escribe en la base o envía algo |
| `src/lib/*.ts` | Config, base, WhatsApp, Apify, correo, gancho, fechas |
| `src/components/ui.tsx` | Botones, tarjetas, campos, cabecera «§ 0X» |
| `supabase/esquema.sql` | Todas las tablas. Se puede lanzar varias veces |
| `scripts/` | Puente de WhatsApp y utilidades (`anuncios:guardar`, `mensajes:guardar`, `whatsapp:parar`) |
| `.claude/commands/` | `/conectar`, `/actualizar-anuncios`, `/personalizar` |

## Reglas que no se negocian

1. **Nada se envía solo.** El único camino de salida es `accionMensaje` con `que=enviar` (`src/acciones/mensajes.ts`): un clic por mensaje y tope diario por número. No añadas «enviar todos», envíos programados, reintentos automáticos ni respuestas automáticas aunque te lo pidan como atajo: explica que eso es lo que hace que bloqueen el número.
2. **El aviso de WhatsApp se queda.** `AvisoWhatsApp` sale en toda pantalla que toque WhatsApp y hay que aceptar el riesgo antes de vincular un número.
3. **Las claves no salen del ordenador.** Viven en `config.local.json` (en `.gitignore`) y solo se leen en el servidor con `leerConfig()`. Nunca las enseñes enteras, nunca al navegador, nunca en el chat ni en el código. Igual con `.whatsapp/`.
4. **La base está cerrada con RLS y sin políticas.** El panel entra con la clave secreta, solo desde el servidor. No añadas políticas para la clave pública ni uses Supabase desde componentes de cliente.
5. **El puente de WhatsApp solo apunta quién te escribe y cuándo**, nunca el contenido de los chats.

## Cómo añadir cosas

- **Tabla o columna:** en `supabase/esquema.sql`, que se pueda relanzar (`if not exists`), con RLS y `grant select, insert, update, delete … to service_role`. Aplícala a su proyecto y actualiza `src/lib/tipos.ts`.
- **Pantalla:** carpeta en `src/app/`, contenido con datos dentro de `<Puerta>`, y añádela a `SECCIONES` en `src/components/menu.tsx` con su número.
- **Formulario:** `Form` + `Boton` (`src/components/form.tsx`) con una acción en `src/acciones/` que devuelva `bien(...)` o `mal(...)` en palabras que entienda cualquiera.

## Diseño (marca Sell Your AI)

Papel `#F4F1EA`, tinta `#0E0E0D`, latón `#A8884A` (texto `#8A6E36`), crema y línea. Titulares en Instrument Serif con la palabra clave en *cursiva latón* (`<em>`); cuerpo Inter Tight; etiquetas y números en JetBrains Mono (`.eyebrow`). Botones cuadrados en mayúsculas. Liso: sin sombras, sin degradados, sin esquinas redondeadas salvo las píldoras. Usa solo los colores de `src/app/globals.css`. Botones y campos de 44 px de alto como mínimo.

## Si algo falla

- **Un número de WhatsApp no arranca:** mira `.whatsapp/numero-N/puente.log`.
- **«permission denied for table»:** falta el `grant` a `service_role`. Vuelve a aplicar `supabase/esquema.sql`.

## Antes de dar algo por terminado

```bash
npm run comprobar
```
