
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TerminalSquare, Check, X } from "lucide-react";

export interface ProcessingConsoleLogProps {
  logLines: string[];
}

export const ProcessingConsoleLog: React.FC<ProcessingConsoleLogProps> = ({ logLines }) => {
  if (!logLines?.length) return null;

  function styleLine(line: string) {
    if (/^Modpack: /.test(line)) {
      const prefix = "Modpack: ";
      const rest = line.slice(prefix.length);
      return (
        <span className="font-bold">
          <span className="text-muted-foreground font-semibold">{prefix}</span>
          <span className="text-blue-600 dark:text-blue-300">{rest}</span>
        </span>
      );
    }
    if (/^\s*→/.test(line)) {
      return (
        <span className="text-violet-700 dark:text-violet-400 font-semibold">
          {line}
        </span>
      );
    }
    if (/✓/.test(line)) {
      return (
        <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
          <Check className="inline mr-1 mb-0.5" size={16} />{line.replace("✓", "")}
        </span>
      );
    }
    if (/! /.test(line)) {
      return (
        <span className="text-destructive font-semibold flex items-center gap-1">
          <X className="inline mr-1 mb-0.5" size={15} />{line}
        </span>
      );
    }
    return <span>{line}</span>;
  }

  return (
    <Card className="w-full mt-6 mb-2 p-0 bg-card shadow-2xl rounded-xl border-2 border-muted/80 overflow-hidden transition hover:shadow-2xl hover:border-primary/50">
      <div className="flex items-center gap-2 p-5 pb-2 border-b bg-card rounded-t-xl">
        <TerminalSquare className="text-primary mr-1" size={22} />
        <span className="font-extrabold text-lg tracking-tight text-primary">Log de Processamento</span>
        <Badge variant="outline" className="ml-auto text-primary bg-primary/10 border-primary/30 text-xs font-bold px-2 py-1">
          {logLines.length}
        </Badge>
      </div>
      <ScrollArea className="h-[300px] w-full">
        <div className="px-3 pt-5 pb-5 w-full md:w-[92%] mx-auto bg-background border border-muted/40 rounded-xl shadow-inner">
          <div className="space-y-2 font-mono text-xs">
            {logLines.map((line, idx) => (
              <div key={idx}>{styleLine(line)}</div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};
