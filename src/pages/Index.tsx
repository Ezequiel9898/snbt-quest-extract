// Página principal para o site de tradução automática de FTB Quests e mapeamento SNBT -> JSON

import React from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ProcessingLog } from "@/components/ProcessingLog";
import { DownloadPanel } from "@/components/DownloadPanel";
import { processModpackZip } from "@/utils/snbtProcessor";
import { toast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";

const Index = () => {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [processing, setProcessing] = React.useState(false);
  const [logLines, setLogLines] = React.useState<string[]>([]);
  const [outputZipBlob, setOutputZipBlob] = React.useState<Blob | null>(null);
  const [jsonPreview, setJsonPreview] = React.useState<string>("");

  async function handleProcessFiles(files: File[]) {
    setProcessing(true);
    setOutputZipBlob(null);
    setLogLines([]);
    setJsonPreview("");
    try {
      // Se algum arquivo for ZIP, processa como antes (só aceita um .zip por vez)
      const zipFile = files.find((f) => f.name.toLowerCase().endsWith(".zip"));
      const snbtFiles = files.filter((f) => f.name.toLowerCase().endsWith(".snbt"));
      if (zipFile) {
        const arr = new Uint8Array(await zipFile.arrayBuffer());
        const result = await processModpackZip(arr);
        setLogLines(result.logLines);
        setJsonPreview(result.jsonResult.slice(0, 5000));
        const zipBlob = await result.outputZip.generateAsync({ type: "blob" });
        setOutputZipBlob(zipBlob);
        toast({
          title: "Processamento concluído!",
          description: "Baixe abaixo os arquivos modificados e a tradução extraída.",
        });
      } else if (snbtFiles.length > 0) {
        // NEW: processa arquivos SNBT diretamente!
        // Para reutilizar a infra, criaremos um zip no navegador contendo os snbts enviados, e usamos o mesmo processador.
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        // adiciona cada snbt no zip dentro de uma pasta fixa simulando o layout "config/ftbquests/quests/"
        for (const file of snbtFiles) {
          zip.file(`config/ftbquests/quests/${file.name}`, await file.text());
        }
        const generatedZip = await zip.generateAsync({ type: "uint8array" });
        const result = await processModpackZip(new Uint8Array(generatedZip));
        setLogLines(result.logLines);
        setJsonPreview(result.jsonResult.slice(0, 5000));
        const zipBlob = await result.outputZip.generateAsync({ type: "blob" });
        setOutputZipBlob(zipBlob);
        toast({
          title: "Processamento concluído!",
          description: "Baixe abaixo os arquivos modificados e a tradução extraída.",
        });
      } else {
        throw new Error("Por favor, envie arquivos .zip ou .snbt.");
      }
    } catch (e: any) {
      toast({
        title: "Erro ao processar arquivos",
        description: String(e?.message || e),
        variant: "destructive"
      });
      setLogLines(["Erro: " + String(e?.message || e)]);
    } finally {
      setProcessing(false);
    }
  }

  function handleFilesAccepted(files: File[]) {
    setSelectedFiles(files);
    handleProcessFiles(files);
  }

  // Layout principal, desktop-first, design limpo e sofisticado, largura máxima, sem sidebar.
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-start py-12 px-6">
      <div className="w-full max-w-5xl space-y-6">
        <header className="flex flex-col items-center justify-center gap-2 mb-2">
          <h1 className="text-4xl font-bold">FTB Quests Tradutor Automático</h1>
          <p className="text-base text-muted-foreground">
            Faça upload dos arquivos <span className="font-semibold">.zip</span> ou <span className="font-semibold">.snbt</span> contendo <span className="font-mono">config/ftbquests/quests/*.snbt</span> e baixe os arquivos já <span className="font-semibold">mapeados para tradução</span> e o <span className="font-mono">en_us.json</span>.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <FileDropZone onFilesAccepted={handleFilesAccepted} processing={processing} />
            <ProcessingLog logLines={logLines} />
          </div>
          <div>
            <Card className="w-full mb-4 p-6 flex flex-col gap-2 bg-card/90">
              <h2 className="font-semibold text-lg mb-2">Como funciona?</h2>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 mb-2">
                <li>Arraste aqui o arquivo <span className="font-mono font-semibold">modpack.zip</span> (ou exporte via CurseForge).</li>
                <li>O site extrai todos os textos legíveis dos arquivos <b>.snbt</b> dentro de <span className="font-mono">config/ftbquests/quests</span>.</li>
                <li>Os textos são convertidos em chaves de tradução – como <code>ptnq.quests.intro.welcome.title</code> – e substituídos dentro dos arquivos .snbt.</li>
                <li>Todas as traduções extraídas são salvas em <span className="font-mono">output/en_us.json</span> para facilitar tradução futura.</li>
                <li>Ao final, você pode baixar os arquivos .snbt processados e o JSON para uso no modpack.</li>
              </ol>
              <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 pl-1">
                <li>Compatível com modpacks FTB modernos.</li>
                <li>Todo o processamento é feito no seu navegador: <b>seu arquivo NÃO é enviado para a internet</b>.</li>
                <li>Design inspirado no script Python original do autor.</li>
              </ul>
            </Card>
            <DownloadPanel outputZipBlob={outputZipBlob} jsonPreview={jsonPreview} />
          </div>
        </div>
        <footer className="mt-12 pt-8 border-t text-xs text-muted-foreground text-center">
          <div>
            <span>
              Feito com <span className="text-red-600">♥</span> para modders brasileiros. | <a href="https://github.com/shirakumo/snbt-i18npy" className="underline" target="_blank" rel="noopener noreferrer">Python original</a>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
