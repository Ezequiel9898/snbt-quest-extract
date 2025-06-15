
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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
      <details className="w-full max-w-xl bg-card border rounded text-xs p-3 mt-0 select-text" style={{maxHeight:220, overflow:"auto"}}>
        <summary className="cursor-pointer font-semibold">Prévia do <code>en_us.json</code></summary>
        <pre className="text-xs font-mono whitespace-pre-wrap">{jsonPreview}</pre>
      </details>
    </div>
  );
};
