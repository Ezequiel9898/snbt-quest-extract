
import React from "react";
import { processModpackZip, processSnbtFiles } from "@/utils/snbtProcessor";
import { toast } from "@/components/ui/use-toast";
import { extractQuestsFromSnbt } from "@/utils/extractQuestsFromSnbt";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderSection } from "@/components/HeaderSection";
import { LeftPanel } from "@/components/LeftPanel";
import { DownloadPanel } from "@/components/DownloadPanel";
import { FooterSection } from "@/components/FooterSection";

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
      const zipFile = files.find((f) => f.name.toLowerCase().endsWith(".zip"));
      const snbtFiles = files.filter((f) => f.name.toLowerCase().endsWith(".snbt"));
      
      if (zipFile) {
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
        let allQuests: string[] = [];
        
        for (const file of snbtFiles) {
          const content = await file.text();
          allQuests = allQuests.concat(extractQuestsFromSnbt(content));
        }
        
        setExtractedQuests(allQuests);
        
        // Use the new processSnbtFiles function
        const result = await processSnbtFiles(snbtFiles);
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

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <ThemeToggle />
      
      <div className="flex-1 flex flex-col py-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <HeaderSection />
        
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
          <div className="flex flex-col min-h-0">
            <LeftPanel
              onFilesAccepted={handleFilesAccepted}
              processing={processing}
              logLines={logLines}
              extractedQuests={extractedQuests}
            />
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
