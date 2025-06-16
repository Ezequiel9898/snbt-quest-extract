
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
    <div className="flex flex-col items-center gap-6 flex-1">
      <Button asChild className="gap-2 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
        <a href={downloadUrl} download="traduzido-output.zip">
          <Download className="mr-2" size={20} /> Baixar arquivos traduzidos (.zip)
        </a>
      </Button>
      
      <Card className="w-full flex-1 p-0 bg-gradient-to-br from-card via-card to-muted/10 shadow-2xl rounded-2xl border-2 border-muted/60 overflow-hidden transition-all duration-300 hover:shadow-3xl hover:border-primary/40 flex flex-col">
        <div className="flex items-center gap-3 p-6 border-b bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 backdrop-blur-sm">
          <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
            <FileText className="text-primary" size={24} />
          </div>
          <div className="flex-1">
            <span className="font-black text-xl tracking-tight text-primary">Prévia do en_us.json</span>
            <p className="text-sm text-muted-foreground mt-0.5">Arquivo de tradução gerado</p>
          </div>
          <Badge variant="outline" className="text-primary bg-primary/10 border-primary/30 font-bold px-3 py-1.5 rounded-lg">
            {jsonPreview.length} chars
          </Badge>
        </div>
        
        <ScrollArea className="flex-1 w-full">
          <div className="p-6">
            <div className="relative">
              <div className="absolute top-3 right-3 z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg border shadow-sm">
                  <Code2 size={14} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">JSON</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-background via-background to-muted/20 border-2 border-muted/30 rounded-2xl p-6 shadow-inner overflow-hidden">
                <pre className="text-sm font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed overflow-x-auto">
                  {jsonPreview}
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
