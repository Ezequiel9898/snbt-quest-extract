
import React from "react";
import { processModpackZip, processSnbtFiles } from "@/utils/snbtProcessor";
import { toast } from "@/components/ui/use-toast";
import { extractValidQuests } from "@/utils/questExtractor";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderSection } from "@/components/HeaderSection";
import { LeftPanel } from "@/components/LeftPanel";
import { DownloadPanel } from "@/components/DownloadPanel";
import { FooterSection } from "@/components/FooterSection";
import { ConfigurationPanel, ProcessingConfig, type ProcessingConfig as Config } from "@/components/ConfigurationPanel";
import { OptimizedQuestList } from "@/components/OptimizedQuestList";
import { QuestData } from "@/utils/questExtractor";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [processing, setProcessing] = React.useState(false);
  const [logLines, setLogLines] = React.useState<string[]>([]);
  const [outputZipBlob, setOutputZipBlob] = React.useState<Blob | null>(null);
  const [jsonPreview, setJsonPreview] = React.useState<string>("");
  const [extractedQuests, setExtractedQuests] = React.useState<QuestData[]>([]);
  const [showConfig, setShowConfig] = React.useState(false);
  
  const [config, setConfig] = React.useState<Config>({
    filterDirectory: 'config/ftbquests/quests',
    outputFormat: 'json',
    includeEmptyValues: false,
    generateBackup: true,
    customPrefix: '',
    preserveFormatting: true,
    sortKeys: false,
    compressOutput: true,
    includeMetadata: false
  });

  async function handleProcessFiles(files: File[]) {
    setProcessing(true);
    setOutputZipBlob(null);
    setLogLines([]);
    setJsonPreview("");
    setExtractedQuests([]);
    
    try {
      const zipFile = files.find((f) => f.name.toLowerCase().endsWith(".zip"));
      const snbtFiles = files.filter((f) => f.name.toLowerCase().endsWith(".snbt"));
      
      let allQuests: QuestData[] = [];
      
      if (zipFile) {
        const arr = new Uint8Array(await zipFile.arrayBuffer());
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(arr);
        const snbtPaths = Object.keys(zip.files).filter(f => f.endsWith(".snbt"));
        
        for (const path of snbtPaths) {
          const content = await zip.files[path].async("string");
          const questsFromFile = extractValidQuests(content, path);
          allQuests = allQuests.concat(questsFromFile);
        }
        
        setExtractedQuests(allQuests);
        const result = await processModpackZip(arr, config);
        setLogLines(result.logLines);
        setJsonPreview(result.jsonResult.slice(0, 5000));
        const zipBlob = await result.outputZip.generateAsync({ type: "blob" });
        setOutputZipBlob(zipBlob);
        
        toast({
          title: "Processamento concluído!",
          description: `${allQuests.length} quests válidas encontradas. Baixe os arquivos modificados.`,
        });
      } else if (snbtFiles.length > 0) {
        for (const file of snbtFiles) {
          const content = await file.text();
          const questsFromFile = extractValidQuests(content, file.webkitRelativePath || file.name);
          allQuests = allQuests.concat(questsFromFile);
        }
        
        setExtractedQuests(allQuests);
        
        const result = await processSnbtFiles(snbtFiles, config);
        setLogLines(result.logLines);
        setJsonPreview(result.jsonResult.slice(0, 5000));
        const zipBlob = await result.outputZip.generateAsync({ type: "blob" });
        setOutputZipBlob(zipBlob);
        
        toast({
          title: "Processamento concluído!",
          description: `${allQuests.length} quests válidas encontradas. Baixe os arquivos modificados.`,
        });
      } else {
        throw new Error("Por favor, envie arquivos .zip ou .snbt.");
      }
    } catch (e: any) {
      console.error("Processing error:", e);
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

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <ThemeToggle />
      
      <div className="flex-1 flex flex-col py-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <HeaderSection />
        
        <div className="mb-6 fade-in-up">
          <Button
            onClick={() => setShowConfig(!showConfig)}
            variant="grass"
            size="lg"
            className="font-semibold"
          >
            ⚙️ {showConfig ? 'Ocultar' : 'Mostrar'} Configurações Avançadas
          </Button>
        </div>
        
        {showConfig && (
          <div className="mb-6">
            <ConfigurationPanel config={config} onConfigChange={setConfig} />
          </div>
        )}
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
          <div className="flex flex-col min-h-0">
            <LeftPanel
              onFilesAccepted={handleFilesAccepted}
              processing={processing}
              logLines={logLines}
              extractedQuests={[]} // Removemos a lista antiga aqui
            />
            <OptimizedQuestList quests={extractedQuests} />
          </div>
          
          <div className="flex flex-col min-h-0">
            <DownloadPanel
              outputZipBlob={outputZipBlob}
              jsonPreview={jsonPreview}
            />
          </div>
        </div>
        
        <FooterSection />
      </div>
    </div>
  );
};

export default Index;
