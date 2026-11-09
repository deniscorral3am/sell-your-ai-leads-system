# Sell Your AI Leads System

Busca negocios en Google Maps, escríbeles por WhatsApp y por correo con un mensaje que abre con algo real de su negocio, y llévalos hasta la llamada. Todo en un panel que corre en tu ordenador y guarda los datos en tu propia base.

> **WhatsApp va por una conexión NO oficial.** Meta puede bloquear el número sin aviso, sobre todo si escribes en frío. Usa un número que puedas perder (nunca el personal ni el principal del negocio). El panel no envía nada solo: cada mensaje lo apruebas tú, con tope diario por número. Si no quieres correr ese riesgo, no conectes WhatsApp: el resto funciona igual.

```
Tú ──► Panel (tu ordenador) ──► Supabase (tu base de datos)
            │
            ├──► Apify ........... negocios de Google Maps + su «gancho»
            ├──► WhatsApp ........ hasta 3 números (no oficial)
            ├──► Gmail ........... correos en frío
            └──► Claude .......... /personalizar con su web · /actualizar-anuncios
```

## Lo más rápido: con Claude Code

```bash
git clone https://github.com/deniscorral3am/sell-your-ai-leads-system.git ~/.claude/skills/leads-system
```

Abre Claude Code y escribe `/leads-system`: te lo instala, te hace 4 preguntas y te deja el panel abierto.

## A mano

Necesitas Node.js 20.18 o más ([nodejs.org](https://nodejs.org)) y una cuenta gratis de [Supabase](https://supabase.com).

```bash
npm install
npm run dev
```

Abre [http://127.0.0.1:3000](http://127.0.0.1:3000) y ve a **Conexiones**. Cada conexión tiene su guía dentro del panel.

| # | Conexión | Qué necesitas | Tiempo |
|---|---|---|---|
| 1 | Base de datos (Supabase) | Un proyecto. Con Claude Code: `/conectar` | 5 min |
| 2 | Buscador (Apify) | Tu token de Apify (5 $ gratis al mes) | 2 min |
| 3 | WhatsApp | El móvil con el número. Lee el aviso | 3 min/número |
| 4 | Correo (Gmail) | Una contraseña de aplicación | 3 min |
| 5 | Meta Ads | El conector de Meta en Claude | 5 min |

## Cómo se usa

| Pantalla | Qué haces |
|---|---|
| **Prospectos** | Buscas por tipo de negocio y ciudad. Cada uno trae su gancho (sin web, nota baja, pocas reseñas…). Marcas y los mandas a la cola |
| **WhatsApp / Correo** | Lees cada mensaje, lo retocas y lo apruebas. Tope por defecto: 25 al día por número y 40 correos |
| **CRM** | Contactado → Ha respondido → Llamada → Propuesta → Cliente, con el valor de cada uno |
| **Llamadas** | Tu agenda de llamadas de venta. Si cierras, pasa a Cliente |
| **Anuncios** | Gasto, resultados y coste por resultado de Meta (`/actualizar-anuncios`) |
| **Métricas** | Lo que mides cada semana contra tu objetivo |

### Comandos de Claude Code (en esta carpeta)

| Comando | Qué hace |
|---|---|
| `/conectar` | Encuentra tu Supabase, crea las tablas y te dice dónde pegar la clave |
| `/personalizar` | Entra en la web de cada negocio de la cola y reescribe su mensaje con un detalle real |
| `/actualizar-anuncios` | Trae tus campañas de Meta a la pantalla Anuncios |

## Dónde quedan tus datos

| Qué | Dónde | ¿A GitHub? |
|---|---|---|
| Prospectos, mensajes, llamadas, métricas | Tu Supabase | No |
| Claves (Supabase, Apify, Gmail) | `config.local.json` | **No** (`.gitignore`) |
| Sesiones de WhatsApp y quién te ha escrito (sin el texto) | `.whatsapp/` | **No** (`.gitignore`) |

No compartas `config.local.json` ni `.whatsapp/`: quien los tenga puede leer tu base y escribir desde tus números.

## Problemas típicos

| Pasa esto | Haz esto |
|---|---|
| «Faltan las tablas» | `/conectar` en Claude Code, o pega `supabase/esquema.sql` en el SQL Editor |
| «Esa es la clave pública» | Va la **secreta** (`sb_secret_…`) |
| No sale el QR | Espera 10 s. Si nada, pulsa **Reintentar** |
| «Sesión cerrada: vuelve a escanear» | Lo has quitado desde el móvil: escanea otra vez |
| Gmail no acepta los datos | Tiene que ser contraseña de aplicación, con verificación en dos pasos |
| La búsqueda tarda | Normal: 1-3 minutos. Prueba con menos resultados |
| Se quedan números encendidos | `npm run whatsapp:parar` |

## Antes de escribir en frío

- **WhatsApp:** número nuevo = pocos mensajes al día y subir poco a poco. Si te marcan como spam, el bloqueo llega rápido.
- **Correo:** mensajes cortos, en texto plano, con opción de baja. Gmail corta cerca de 500 al día.
- **Datos:** el buscador trae información pública de Google Maps. En España la LSSI limita el correo comercial que nadie ha pedido (también a empresas) y el RGPD protege los datos de autónomos. Escribe mensajes personales de uno en uno, identifícate, da siempre opción de no recibir más y, si vas a escala, consúltalo con tu asesor.

---

Hecho por [Sell Your AI](https://sellyourai.io).
