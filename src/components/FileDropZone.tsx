
import React, { useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FileDropZoneProps {
  onFilesAccepted: (files: File[]) => void;
  processing: boolean;
}

const ACCEPT = {
  "application/zip": [".zip"],
  "text/plain": [".snbt"],
  "application/octet-stream": [".snbt"],
};

export const FileDropZone: React.FC<FileDropZoneProps> = ({ onFilesAccepted, processing }) => {
  const dropRef = useRef<HTMLDivElement | null>(null);

  const onDrop = React.useCallback(
    (files: File[]) => {
      if (files && files.length > 0) onFilesAccepted(files);
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: true,
    noClick: processing,
    noDrag: processing,
    disabled: processing,
  });

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const snbtFiles = files.filter(file => file.name.toLowerCase().endsWith('.snbt'));
    if (snbtFiles.length > 0) {
      onFilesAccepted(snbtFiles);
    }
  };

  return (
    <Card className="w-full px-8 py-12 flex flex-col items-center minecraft-card border-4 border-dashed border-primary/30 hover:border-primary/60 transition-all duration-300 slide-up">
      <div
        {...getRootProps()}
        className={`w-full flex flex-col items-center py-8 transition-all duration-300 cursor-pointer rounded-lg ${
          isDragActive ? "bg-primary/10 scale-105" : "hover:bg-primary/5"
        } ${processing ? "animate-pulse" : ""}`}
        tabIndex={0}
        aria-label="Área para soltar arquivos ZIP ou SNBT"
        ref={dropRef}
        aria-disabled={processing}
      >
        <input {...getInputProps()} />
        <UploadCloud size={56} className={`mb-4 text-primary ${processing ? "animate-bounce" : "glow"}`} />
        <div className="font-bold text-xl text-center font-orbitron">
          {processing
            ? (
                <>
                  <div className="text-accent">⚡ Processando...</div>
                  <div className="text-sm text-muted-foreground mt-2">Extraindo quests do Minecraft</div>
                </>
              )
            : (
                <>
                  <div className="text-primary">📦 Arraste seus arquivos aqui!</div>
                  <div className="text-base mt-2 text-muted-foreground">
                    Suporta <span className="font-semibold text-accent">.zip</span> e <span className="font-semibold text-accent">.snbt</span>
                  </div>
                  <div className="text-sm mt-1 text-muted-foreground">
                    🖱️ Ou clique para selecionar
                  </div>
                </>
              )
          }
        </div>
      </div>
      
      <div className="mt-6 w-full">
        <label htmlFor="folder-input" className="block w-full">
          <div className="w-full px-6 py-4 minecraft-card border-2 border-dashed border-accent/50 hover:border-accent transition-all duration-300 cursor-pointer text-center hover:scale-105">
            <span className="text-base font-semibold text-accent">📁 Ou selecione uma pasta completa</span>
            <div className="text-sm text-muted-foreground mt-1">Para processar diretórios do modpack</div>
            <input
              id="folder-input"
              type="file"
              // @ts-ignore - webkitdirectory is a valid HTML attribute
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderSelect}
              className="hidden"
              disabled={processing}
            />
          </div>
        </label>
      </div>
    </Card>
  );
};
