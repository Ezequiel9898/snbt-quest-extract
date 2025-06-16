
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Code2 } from "lucide-react";

interface DownloadPanelProps {
  outputZipBlob: Blob | null;
  jsonPreview: string;
}

export const DownloadPanel: React.FC<DownloadPanelProps> = ({ outputZipBlob, jsonPreview }) => {
  if (!outputZipBlob) return null;
  const downloadUrl = URL.createObjectURL(outputZipBlob);

  return (
    <div className="flex flex-col gap-6 h-full">
      <Button asChild className="gap-2 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
        <a href={downloadUrl} download="traduzido-output.zip">
          <Download className="mr-2" size={20} /> Baixar arquivos traduzidos (.zip)
        </a>
      </Button>
      
      <Card className="flex-1 flex flex-col p-0 bg-gradient-to-br from-card via-card to-muted/10 shadow-xl border-2 border-muted/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary/40 min-h-0">
        <div className="flex items-center gap-3 p-5 border-b bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 backdrop-blur-sm">
          <div className="p-2 bg-primary/10 rounded-xl shadow-sm">
            <FileText className="text-primary" size={20} />
          </div>
          <div className="flex-1">
            <span className="font-black text-lg tracking-tight text-primary">Prévia do en_us.json</span>
            <p className="text-xs text-muted-foreground mt-0.5">Arquivo de tradução gerado</p>
          </div>
          <Badge variant="outline" className="text-primary bg-primary/10 border-primary/30 font-bold px-2 py-1 rounded-lg text-xs">
            {jsonPreview.length} chars
          </Badge>
        </div>
        
        <div className="flex-1 min-h-0 flex flex-col">
          <ScrollArea className="flex-1 w-full">
            <div className="p-5">
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <div className="flex items-center gap-2 px-2 py-1 bg-background/90 backdrop-blur-sm rounded-md border shadow-sm">
                    <Code2 size={12} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">JSON</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-background via-background to-muted/20 border-2 border-muted/30 rounded-xl p-4 shadow-inner overflow-hidden">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed overflow-x-auto">
                    {jsonPreview}
                  </pre>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
};
