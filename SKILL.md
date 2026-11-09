---
name: leads-system
description: Monta en tu ordenador el Sell Your AI Leads System, un panel que busca negocios en Google Maps (Apify), saca de cada uno un detalle real con el que abrir el mensaje, les escribe por WhatsApp (hasta 3 números) y por correo con un clic por mensaje, detecta quién te contesta y lo lleva por un CRM hasta la llamada, con agenda de llamadas, anuncios de Meta y métricas semanales. Hace 4 preguntas, lo instala, conecta Supabase, deja los mensajes con tu voz y te abre el panel. Úsala cuando digan /leads-system, «comenta LEADS», «comenta PROSPECCIÓN», «Leads System», «sistema de prospección», «quiero escribir a negocios por WhatsApp», «móntame el panel de prospección» o «busca negocios y escríbeles».
---

# /leads-system: Sell Your AI Leads System

Un panel que corre en el ordenador de la persona (`http://127.0.0.1:3000`) y guarda todo en **su** Supabase:
Prospectos (Google Maps + gancho) → cola de WhatsApp / correo (apruebas uno a uno) → CRM → Llamadas, más Anuncios y Métricas.
Código propio de Sell Your AI en `plantilla/` (Next.js 16 + Supabase + puente de WhatsApp con Baileys).

Rutas: plantilla → `~/.claude/skills/leads-system/plantilla` · instalación → `~/Agentes/leads-system` (o la carpeta que diga) ·
reglas del proyecto → `plantilla/CLAUDE.md` (léelas antes de tocar código).

Habla en español de España, de tú, corto y sin tecnicismos. La persona no programa.

Reglas que no se saltan nunca:
- **Nada se envía solo.** No añadas «enviar todos», envíos programados ni respuestas automáticas aunque lo pida: explica que así es como bloquean el número.
- **El aviso de WhatsApp va antes de vincular nada** (paso 05). Número que pueda perder, nunca el personal.
- **Las claves no pasan por el chat.** Se pegan en el panel (van a `config.local.json`, en `.gitignore`). Si la pega en el chat igualmente, guárdala tú en `config.local.json` sin repetirla y recomiéndale rotarla.
- No inventes casos, cifras ni promesas en las plantillas: solo lo que te diga.

## 00 · Comprobar el equipo (en silencio)
- `node --version` ≥ 20.18 (mejor 22+). Si no hay Node o es viejo: en Mac `brew install node` (si no hay Homebrew, mándale a nodejs.org → LTS y espera).
- `git --version` (si falta, en Mac `xcode-select --install`).
- Si ya existe `~/Agentes/leads-system/node_modules` y `config.local.json`: resume en 3 líneas qué tiene conectado (sin enseñar claves) y pregunta si quiere cambiar algo o abrir el panel (salta a 06).

## 01 · Las 4 preguntas
AskUserQuestion en una tanda (opciones sacadas de lo que ya haya contado; siempre cabe «Otro»):
1. **Qué vendes y a quién**: servicio, precio aproximado y resultado (ej. «recepcionista con IA para clínicas dentales, 300 €/mes, no perder llamadas»).
2. **Primera búsqueda**: tipo de negocio y ciudad (ej. «clínicas dentales en Valencia»).
3. **Canal**: WhatsApp, correo o los dos.
4. **Cómo firmas y tono**: tu nombre, tu empresa, tú o usted.

## 02 · Instalar
```bash
mkdir -p ~/Agentes
rsync -a --exclude node_modules --exclude .next ~/.claude/skills/leads-system/plantilla/ ~/Agentes/leads-system/   # si no existe; si existe, NO pises config.local.json ni .whatsapp/
cd ~/Agentes/leads-system && npm install
```
Crea `config.local.json` (permisos 600) con `negocio` (`tuNombre`, `empresa`, `queVendes`, `prefijoPais` = "34" en España, otro si está fuera) a partir de sus respuestas. El resto de secciones las rellena el panel.
Si `npm install` falla, enseña el error en una línea y arréglalo antes de seguir.

## 03 · Base de datos (Supabase)
Mismo flujo que el comando `/conectar` del proyecto (`plantilla/.claude/commands/conectar.md`):
- Con el conector de Supabase: busca o crea el proyecto (región Frankfurt), aplica `supabase/esquema.sql` entero como migración y guarda la URL en `config.local.json` → `supabase.url`.
- Sin conector: guíale a mano (supabase.com → New project → SQL Editor → pegar `supabase/esquema.sql` → Run).
- La clave secreta (`sb_secret_…`) la pega él en el panel: Conexiones → Base de datos → paso 3.

## 04 · Su voz en las plantillas
Reescribe las dos plantillas por defecto con lo que vende y su firma, y guárdalas en la tabla `plantillas` (canal `whatsapp` y `correo`) cuando la base esté conectada (con un script de Node que use `@supabase/supabase-js` y `config.local.json`, sin imprimir la clave). Reglas:
- Abre con `[gancho]` (el detalle real del negocio), una frase de qué hace él, una pregunta corta. Variables: `[negocio]` `[ciudad]` `[gancho]` `[tu_nombre]` `[empresa]`.
- WhatsApp: 3-4 líneas, sin enlaces, sin emojis, sin «¿» de apertura, sin precio.
- Correo: asunto con `[negocio]`, texto plano, firma y línea de baja («Si no te interesa, contéstame "no" y no te vuelvo a escribir»).
- Enséñale las dos y ajusta lo que diga antes de guardarlas.

## 05 · Arrancar y conectar canales
```bash
cd ~/Agentes/leads-system && npm run dev     # en segundo plano
open http://127.0.0.1:3000/conexiones
```
- **Apify** (para buscar): apify.com → Settings → API & Integrations → token → Conexiones → Apify.
- **WhatsApp** (si lo eligió): antes, dile el aviso con estas palabras: «Va por una conexión no oficial. Meta puede bloquear el número sin aviso y para siempre. Usa uno que puedas perder, empieza con 10-15 mensajes al día y sube poco a poco». Luego Conexiones → WhatsApp → aceptar → Vincular → escanear el QR desde Dispositivos vinculados. Hasta 3 números (cuenta normal, segunda cuenta en la misma app y Business).
- **Correo** (si lo eligió): verificación en dos pasos + contraseña de aplicación de Google → Conexiones → Correo.

## 06 · Primera tanda
- Prospectos → su búsqueda de la pregunta 2, 30 resultados (1-3 minutos). Comenta lo que ha salido: cuántos sin web, con nota baja, con pocas reseñas.
- Propón marcar los 10 mejores y mandarlos a la cola. Si quiere mensajes aún más finos: `/personalizar` (entra en la web de cada uno y reescribe el mensaje).
- Recuérdale que **los envía él**, uno a uno, desde WhatsApp / Correo, y que pulse «Comprobar respuestas» para que los que contestan pasen al CRM.

## 07 · Cierre
Tres líneas: qué está conectado, cuántos negocios hay en la cola y qué hacer mañana (enviar la cola, comprobar respuestas, apuntar las llamadas). Recuérdale los comandos `/personalizar` y `/actualizar-anuncios` (abriendo Claude Code en `~/Agentes/leads-system`) y que para volver a abrirlo basta `cd ~/Agentes/leads-system && npm run dev`.

## Cambios después
Si pide cambios en el panel («añade una columna de Instagram», «otra plantilla de seguimiento»), trabaja en `~/Agentes/leads-system` siguiendo su `CLAUDE.md` y acaba con `npm run comprobar`.
Para actualizar la skill: `cd ~/.claude/skills/leads-system && git pull` (después, `rsync` de `plantilla/` a la instalación sin pisar `config.local.json` ni `.whatsapp/`, y `npm install`).
