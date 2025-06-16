
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText } from "lucide-react";

interface DownloadPanelProps {
  outputZipBlob: Blob | null;
  jsonPreview: string;
}

export const DownloadPanel: React.FC<DownloadPanelProps> = ({ outputZipBlob, jsonPreview }) => {
  if (!outputZipBlob) return null;
  const downloadUrl = URL.createObjectURL(outputZipBlob);

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      <Button asChild className="gap-2 px-6 py-3 text-base">
        <a href={downloadUrl} download="traduzido-output.zip">
          <Download className="mr-1" /> Baixar arquivos traduzidos (.zip)
        </a>
      </Button>
      
      <Card className="w-full mt-6 mb-2 p-0 bg-card shadow-2xl rounded-xl border-2 border-muted/80 overflow-hidden transition hover:shadow-2xl hover:border-primary/50">
        <div className="flex items-center gap-2 p-5 pb-2 border-b bg-card rounded-t-xl">
          <FileText className="text-primary mr-1" size={22} />
          <span className="font-extrabold text-lg tracking-tight text-primary">Prévia do en_us.json</span>
          <Badge variant="outline" className="ml-auto text-primary bg-primary/10 border-primary/30 text-xs font-bold px-2 py-1">
            {jsonPreview.length} chars
          </Badge>
        </div>
        <ScrollArea className="h-[450px] md:h-[380px] w-full">
          <div className="px-3 pt-5 pb-5 w-full md:w-[92%] mx-auto bg-background border border-muted/40 rounded-xl shadow-inner">
            <pre className="text-xs font-mono whitespace-pre-wrap">{jsonPreview}</pre>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
