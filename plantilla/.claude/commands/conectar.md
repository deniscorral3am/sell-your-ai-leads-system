---
description: Conecta el panel con tu proyecto de Supabase y crea las tablas
---

Conecta este panel con el proyecto de Supabase de la persona. Háblale en español de España, de tú, corto y sin tecnicismos.

1. **Busca el proyecto** con las herramientas del conector de Supabase. Si no las tienes, para y dile que active el conector en claude.ai (Ajustes → Conectores → Supabase) y reinicie Claude Code; mientras tanto puede seguir la guía del panel (Conexiones → Base de datos). Si hay varios proyectos, pregunta cuál. Si no hay ninguno, ofrece crearlo (región Frankfurt, `eu-central-1`).
2. **Crea las tablas** aplicando el contenido completo de `supabase/esquema.sql` como migración. Se puede lanzar varias veces sin romper nada. No lo modifiques.
3. **Guarda la URL** del proyecto en `config.local.json`, en `supabase.url`. Si el archivo no existe, créalo así y rellena solo la URL:

   ```json
   { "supabase": { "url": "", "clave": "" } }
   ```

   Si ya existe, cambia solo `supabase.url` y deja todo lo demás igual.
4. **Pídele la clave secreta**, que el conector no puede leer: en Supabase, Project Settings → API Keys → «Secret keys» (empieza por `sb_secret_`). Que la pegue en el panel, en Conexiones → Base de datos → paso 3, y pulse «Guardar y probar». No le pidas que la pegue en el chat.
5. **Cierra** diciéndole que cuando el panel ponga «Base conectada» ya puede conectar Apify y buscar negocios.

Reglas: nunca enseñes ni escribas claves en el chat, nunca subas `config.local.json` a GitHub y no des acceso a las tablas a la clave pública (`sb_publishable_` o `anon`): están cerradas con RLS a propósito.
