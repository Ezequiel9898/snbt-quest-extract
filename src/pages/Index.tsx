import React from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ProcessingLog } from "@/components/ProcessingLog";
import { DownloadPanel } from "@/components/DownloadPanel";
import { processModpackZip } from "@/utils/snbtProcessor";
import { toast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { extractQuestsFromSnbt } from "@/utils/extractQuestsFromSnbt";
import { QuestList } from "@/components/QuestList";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Info, ArrowDown, ArrowUp, Check, FileDown, FileText } from "lucide-react";
import { ProcessingConsoleLog } from "@/components/ProcessingConsoleLog";

const Index = () => {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [processing, setProcessing] = React.useState(false);
  const [logLines, setLogLines] = React.useState<string[]>([]);
  const [outputZipBlob, setOutputZipBlob] = React.useState<Blob | null>(null);
  const [jsonPreview, setJsonPreview] = React.useState<string>("");

  const [extractedQuests, setExtractedQuests] = React.useState<string[]>([]);

  async function handleProcessFiles(files: File[]) {
    setProcessing(true);
    setOutputZipBlob(null);
    setLogLines([]);
    setJsonPreview("");
    setExtractedQuests([]);
    try {
      // Se algum arquivo for ZIP, processa como antes (só aceita um .zip por vez)
      const zipFile = files.find((f) => f.name.toLowerCase().endsWith(".zip"));
      const snbtFiles = files.filter((f) => f.name.toLowerCase().endsWith(".snbt"));
      if (zipFile) {
        // Extração dos quests de todos arquivos snbt encontrados dentro do zip
        const arr = new Uint8Array(await zipFile.arrayBuffer());
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(arr);
        const snbtPaths = Object.keys(zip.files).filter(f => f.endsWith(".snbt"));
        let allQuests: string[] = [];
        for (const path of snbtPaths) {
          const content = await zip.files[path].async("string");
          allQuests = allQuests.concat(extractQuestsFromSnbt(content));
        }
        setExtractedQuests(allQuests);
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
        let allQuests: string[] = [];
        for (const file of snbtFiles) {
          const content = await file.text();
          allQuests = allQuests.concat(extractQuestsFromSnbt(content));
        }
        setExtractedQuests(allQuests);
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
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
      setExtractedQuests([]);
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
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-zinc-100/90 to-primary/5 flex flex-col items-center justify-start py-12 px-4 md:px-10">
      <div className="w-full max-w-5xl space-y-7 md:space-y-10">
        <header className="flex flex-col items-center justify-center gap-3 mb-4">
          <h1 className="text-4xl md:text-5xl font-black flex items-center gap-2 tracking-tighter">
            <BookOpen className="text-primary drop-shadow-sm" size={40} />
            FTB Quests Tradutor Automático
            <Badge className="ml-2" variant="secondary">Beta</Badge>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl text-center leading-relaxed">
            Faça upload dos arquivos <span className="font-semibold">.zip</span> ou <span className="font-semibold">.snbt</span> contendo <span className="font-mono px-1 py-0.5 rounded bg-muted/40">config/ftbquests/quests/*.snbt</span>
            e baixe os arquivos já <span className="font-semibold text-primary">mapeados para tradução</span> e o <span className="font-mono px-1 py-0.5 rounded bg-muted/40">en_us.json</span>.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
          <div>
            <FileDropZone onFilesAccepted={handleFilesAccepted} processing={processing} />
            <ProcessingConsoleLog logLines={logLines} />
            <QuestList quests={extractedQuests} />
          </div>
          <div>
            <Card className="w-full mb-4 p-0 flex flex-col gap-0 bg-gradient-to-br from-primary/10 via-card/90 to-muted/30 shadow-xl border-2 border-muted animate-fade-in rounded-2xl">
              <div className="flex items-center gap-2 p-4 pb-2 border-b">
                <Info className="text-primary animate-pulse" size={22} />
                <span className="font-semibold text-lg">Como funciona?</span>
              </div>
              <div className="p-4 pt-2 space-y-3">
                <ComoFuncionaSteps />
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 pl-1 space-y-1">
                  <li>Compatível com modpacks FTB modernos.</li>
                  <li>Todo o processamento é feito no seu navegador: <b>seu arquivo NÃO é enviado para a internet</b>.</li>
                  <li>Design inspirado no script Python original do autor.</li>
                </ul>
              </div>
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

function Step({ icon, text, className }: { icon: React.ReactNode; text: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-3 bg-muted/60 rounded px-3 py-2 shadow group hover:scale-105 transition-transform ${className ?? ""}`}>
      <div className="mt-1">{icon}</div>
      <span className="text-sm">{text}</span>
    </div>
  );
}

const ComoFuncionaSteps = () => (
  <div className="flex flex-col gap-3">
    <Step
      icon={<ArrowDown size={18} className="text-blue-500 animate-bounce" />}
      text={
        <>
          Arraste aqui o arquivo <span className="font-mono font-semibold">modpack.zip</span> (ou exporte via CurseForge).
        </>
      }
    />
    <Step
      icon={<Check size={18} className="text-green-600 dark:text-green-400 animate-fade-in" />}
      text={
        <>
          O site extrai todos os textos legíveis dos arquivos <b>.snbt</b> dentro de <span className="font-mono">config/ftbquests/quests</span>.
        </>
      }
    />
    <Step
      icon={<ArrowUp size={18} className="text-primary animate-fade-in" />}
      text={
        <>
          Os textos são convertidos em chaves de tradução como <code>ptnq.quests.intro.welcome.title</code> e substituídos nos arquivos.
        </>
      }
    />
    <Step
      icon={<FileText size={18} className="text-secondary animate-fade-in" />}
      text={
        <>
          Todas as traduções extraídas são salvas em <span className="font-mono">output/en_us.json</span> para facilitar tradução futura.
        </>
      }
    />
    <Step
      icon={<FileDown size={18} className="text-muted-foreground animate-fade-in" />}
      text={
        <>
          Por fim, você pode baixar os arquivos .snbt processados e o JSON para uso no modpack.
        </>
      }
    />
  </div>
);

export default Index;
