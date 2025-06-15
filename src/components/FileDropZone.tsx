
import React, { useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FileDropZoneProps {
  onFileAccepted: (file: File) => void;
  processing: boolean;
}
const ACCEPT = { "application/zip": [".zip"] };

export const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileAccepted, processing }) => {
  const dropRef = useRef<HTMLDivElement | null>(null);

  const onDrop = React.useCallback((files: File[]) => {
    if (files && files[0]) onFileAccepted(files[0]);
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: false,
    maxFiles: 1,
    noClick: processing,
    noDrag: processing,
    disabled: processing,
  });

  return (
    <Card className="w-full px-8 py-12 flex flex-col items-center border-2 border-dashed border-muted animate-in">
      <div
        {...getRootProps()}
        className={`w-full flex flex-col items-center py-6 transition-all duration-200 cursor-pointer ${
          isDragActive ? "bg-accent/60" : ""
        }`}
        tabIndex={0}
        aria-label="Área para soltar arquivo ZIP"
        ref={dropRef}
        aria-disabled={processing}
      >
        <input {...getInputProps()} />
        <UploadCloud size={44} className="mb-3 text-primary" />
        <div className="font-medium text-lg">
          {processing
            ? "Processando..."
            : (
                <>
                  Arraste o arquivo <span className="font-semibold">.zip</span> do modpack aqui<br />
                  <span className="text-xs">Ou clique para selecionar</span>
                </>
              )
          }
        </div>
      </div>
    </Card>
  );
};
