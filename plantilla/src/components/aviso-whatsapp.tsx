// Va en toda pantalla que toque WhatsApp. Sobrio, pero siempre visible.
export function AvisoWhatsApp() {
  return (
    <div className="mb-8 border-l-2 border-aviso bg-aviso-suave px-4 py-3 text-sm leading-relaxed text-aviso">
      <strong>WhatsApp va por una conexión NO oficial.</strong> Meta puede bloquear el número sin aviso, sobre todo si
      escribes en frío. Usa un número que puedas perder (nunca el personal ni el principal del negocio), empieza con
      pocos mensajes al día y sube poco a poco.
    </div>
  );
}
