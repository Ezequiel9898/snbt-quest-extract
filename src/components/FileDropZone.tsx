
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
    <Card className="w-full px-8 py-12 flex flex-col items-center border-2 border-dashed border-muted animate-in">
      <div
        {...getRootProps()}
        className={`w-full flex flex-col items-center py-6 transition-all duration-200 cursor-pointer ${
          isDragActive ? "bg-accent/60" : ""
        }`}
        tabIndex={0}
        aria-label="Área para soltar arquivos ZIP ou SNBT"
        ref={dropRef}
        aria-disabled={processing}
      >
        <input {...getInputProps()} />
        <UploadCloud size={44} className="mb-3 text-primary" />
        <div className="font-medium text-lg text-center">
          {processing
            ? "Processando..."
            : (
                <>
                  Arraste arquivos <span className="font-semibold">.zip</span> <b>ou</b> <span className="font-semibold">.snbt</span> aqui<br />
                  <span className="text-xs">Ou clique para selecionar arquivos</span>
                </>
              )
          }
        </div>
      </div>
      
      <div className="mt-4 w-full">
        <label htmlFor="folder-input" className="block w-full">
          <div className="w-full px-4 py-3 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 transition-colors cursor-pointer text-center">
            <span className="text-sm font-medium">Ou selecione uma pasta do projeto</span>
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
