import { Cabecera, Paso } from "@/components/ui";

export default function GuiaMeta() {
  return (
    <>
      <Cabecera numero="08.5" eyebrow="Conexión · 5 min" titulo={<>Tus anuncios de <em>Meta</em></>}>
        El panel no guarda ningún token de Meta. Claude lee tus campañas con su conector y deja aquí la foto.
      </Cabecera>
      <ol className="max-w-3xl">
        <Paso n={1} titulo="Activa el conector de Meta en Claude">
          <p>En <a className="underline" href="https://claude.ai/settings/connectors" target="_blank" rel="noreferrer">claude.ai → Ajustes → Conectores</a>, añade <strong>Meta Ads</strong> (o Facebook) y entra con la cuenta que lleva tus anuncios.</p>
        </Paso>
        <Paso n={2} titulo="Reinicia Claude Code">
          <p>Ciérralo y ábrelo otra vez en la carpeta del panel para que vea el conector.</p>
        </Paso>
        <Paso n={3} titulo="Trae los números">
          <p>Escribe <code className="bg-crema px-1.5 font-mono">/actualizar-anuncios</code> (últimos 7 días) o <code className="bg-crema px-1.5 font-mono">/actualizar-anuncios último mes</code>. Solo lee: no toca tus campañas.</p>
        </Paso>
      </ol>
    </>
  );
}
