---
description: Trae tus campañas de Meta Ads y las enseña en la pantalla Anuncios del panel
---

Actualiza la pantalla **Anuncios** con los números reales de la cuenta de Meta de la persona. En español de España, de tú, corto.

1. **Lee las campañas** con las herramientas del conector de Meta Ads / Facebook. Si no las tienes, para y mándale a la guía del panel: Conexiones → Meta Ads. Si tiene varias cuentas publicitarias, pregunta cuál.
2. **Periodo:** últimos 7 días, salvo que pida otro ($ARGUMENTS).
3. Por cada campaña con gasto en el periodo (o activa): id, nombre, estado (`ACTIVE`, `PAUSED`…), gasto, resultados y qué es un resultado (mensajes iniciados, clientes potenciales, compras, clics…). Usa el resultado propio del objetivo de cada campaña.
4. **Escribe** `datos/anuncios.json` así:

   ```json
   {
     "desde": "AAAA-MM-DD",
     "hasta": "AAAA-MM-DD",
     "moneda": "EUR",
     "campanas": [
       { "id": "123", "nombre": "Campaña", "estado": "ACTIVE", "gasto": 412.5, "resultados": 21, "tipo_resultado": "Clientes potenciales" }
     ]
   }
   ```

   Números sin símbolos ni separadores de miles. `moneda` = la de la cuenta.
5. **Guarda** con `npm run anuncios:guardar -- datos/anuncios.json`. Si falla, enséñale el mensaje y arregla la causa.
6. **Resume** en tres líneas: gasto total, resultados, la campaña que mejor rinde (menor coste por resultado) y la peor. Dile que ya lo ve en Anuncios.

Reglas: este comando solo lee. No pauses, no edites ni crees campañas aunque parezca buena idea, salvo que lo pida aparte y de forma explícita. No inventes números: lo que no venga de Meta, fuera.
