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
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-start py-12 px-4 md:px-10">
      <ThemeToggle />
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
          <div className="flex flex-col">
            <FileDropZone onFilesAccepted={handleFilesAccepted} processing={processing} />
            <ProcessingConsoleLog logLines={logLines} />
            <QuestList quests={extractedQuests} />
          </div>
          <div className="flex flex-col">
            <Card className="w-full mb-6 p-0 flex flex-col gap-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-xl border-2 border-muted/60 animate-fade-in rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Info className="text-primary" size={20} />
                </div>
                <span className="font-bold text-xl tracking-tight text-foreground">Como funciona?</span>
              </div>
              <div className="p-6 space-y-4">
                <ComoFuncionaSteps />
                <div className="mt-6 pt-4 border-t border-muted/30">
                  <div className="text-center">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">Características</h4>
                    <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <Check size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>Compatível com modpacks FTB modernos</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <Check size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>Processamento 100% local no navegador</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <Check size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>Baseado no script Python original</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <DownloadPanel outputZipBlob={outputZipBlob} jsonPreview={jsonPreview} />
          </div>
        </div>
        <footer className="mt-12 pt-8 border-t text-xs text-muted-foreground flex items-center justify-center text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <BookOpen className="mr-2 text-primary" size={18} />
              <span>
                Feito com <span className="text-red-600">♥</span> para modders brasileiros. | <a href="https://github.com/shirakumo/snbt-i18npy" className="underline" target="_blank" rel="noopener noreferrer">Python original</a>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

function Step({ icon, text, className }: { icon: React.ReactNode; text: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl px-4 py-3 shadow-sm border border-muted/40 group hover:shadow-md hover:border-primary/30 transition-all duration-200 ${className ?? ""}`}>
      <div className="flex-shrink-0 mt-0.5 p-2 bg-background rounded-lg shadow-sm border border-muted/50">
        {icon}
      </div>
      <span className="text-sm leading-relaxed text-foreground/90">{text}</span>
    </div>
  );
}

const ComoFuncionaSteps = () => (
  <div className="flex flex-col gap-4">
    <Step
      icon={<ArrowDown size={18} className="text-blue-500" />}
      text={
        <>
          Arraste o arquivo <span className="font-semibold bg-primary/10 px-1.5 py-0.5 rounded text-primary">modpack.zip</span> ou arquivos <span className="font-semibold bg-primary/10 px-1.5 py-0.5 rounded text-primary">.snbt</span>
        </>
      }
    />
    <Step
      icon={<Check size={18} className="text-green-600 dark:text-green-400" />}
      text={
        <>
          Extrai textos dos arquivos dentro de <span className="font-mono text-xs bg-muted/60 px-1.5 py-0.5 rounded">config/ftbquests/quests</span>
        </>
      }
    />
    <Step
      icon={<ArrowUp size={18} className="text-primary" />}
      text={
        <>
          Converte em chaves como <span className="font-mono text-xs bg-accent/60 px-1.5 py-0.5 rounded">ptnq.quests.intro.title</span>
        </>
      }
    />
    <Step
      icon={<FileText size={18} className="text-violet-600 dark:text-violet-400" />}
      text={
        <>
          Gera o <span className="font-mono text-xs bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded text-violet-700 dark:text-violet-300">en_us.json</span> para tradução
        </>
      }
    />
    <Step
      icon={<FileDown size={18} className="text-orange-600 dark:text-orange-400" />}
      text={
        <>
          Baixe os arquivos <span className="font-semibold">.snbt processados</span> e o JSON
        </>
      }
    />
  </div>
);

export default Index;
