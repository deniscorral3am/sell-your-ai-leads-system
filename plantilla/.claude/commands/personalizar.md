---
description: Lee la web de cada negocio de la cola y reescribe su mensaje con un detalle real
---

Personaliza los mensajes **pendientes** de la cola (WhatsApp, correo o los dos: $ARGUMENTS, por defecto los dos, máximo 25 por tanda). En español de España, de tú.

1. **Contexto:** lee `config.local.json` → `negocio` (nombre, empresa y qué vende). Si `queVendes` está vacío, pregúntale en una frase qué vende y a quién antes de seguir.
2. **La cola:** consulta Supabase con las credenciales de `config.local.json` (en el servidor, con un script de Node que use `@supabase/supabase-js`; nunca imprimas la clave) los mensajes con `estado = 'pendiente'` y `personalizado = false`, con su prospecto (`nombre`, `web`, `ciudad`, `categoria`, `nota`, `resenas`, `gancho`).
3. **Por cada negocio con web**, ábrela (WebFetch o navegador) y busca UNA cosa concreta y comprobable que encaje con lo que vende la persona: reservas solo por teléfono, formulario que no contesta, sin precios, horario que deja fuera las tardes, chat inexistente, última publicación de hace meses… Sin web, usa la nota y las reseñas de Google.
4. **Reescribe el mensaje** partiendo del texto actual (respeta su tono y su firma): primera frase con el detalle real, una frase de qué hace la persona y una pregunta corta. WhatsApp: máximo 3-4 líneas, sin enlaces ni emojis, sin «¿» inicial. Correo: asunto corto con el nombre del negocio, sin palabras de spam («gratis», «oferta», «urgente»).
5. **Guarda** en `datos/personalizados.json`:

   ```json
   { "mensajes": [ { "id": "<id del mensaje>", "texto": "…", "asunto": "… (solo correo)", "gancho": "el detalle en una línea" } ] }
   ```

   y lanza `npm run mensajes:guardar -- datos/personalizados.json`.
6. **Cuenta** cuántos has personalizado y 2 ejemplos, y recuérdale que los revise en WhatsApp / Correo antes de aprobarlos.

Reglas: **nunca envíes nada** ni cambies el estado de un mensaje: solo el texto. No inventes datos (si no ves nada concreto, deja el gancho de Google). Ni precios, ni casos, ni cifras que la persona no te haya dado.
