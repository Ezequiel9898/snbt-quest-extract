
import React from "react";
import { TerminalSquare, Check, X } from "lucide-react";

export interface ProcessingConsoleLogProps {
  logLines: string[];
}

export const ProcessingConsoleLog: React.FC<ProcessingConsoleLogProps> = ({ logLines }) => {
  if (!logLines?.length) return null;

  // Regex helpers para estilização
  function styleLine(line: string) {
    // Estilizar prefixos especiais dos logs do script
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
    // defaults
    return <span>{line}</span>;
  }

  return (
    <div className="w-full mt-4 mb-6 bg-zinc-900/90 dark:bg-zinc-800/70 border border-zinc-700 rounded-xl shadow-2xl p-0 overflow-hidden font-mono">
      <div className="flex items-center gap-2 p-3 border-b border-zinc-800 bg-gradient-to-r from-black/30 via-zinc-800/50 to-zinc-900/30 select-none">
        <TerminalSquare className="text-primary animate-pulse" size={20} />
        <span className="font-mono font-semibold text-sm tracking-widest text-primary/80">Log de Processamento</span>
      </div>
      <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto scrollbar-none text-xs bg-black/10">
        {logLines.map((line, idx) => (
          <div key={idx}>{styleLine(line)}</div>
        ))}
      </div>
    </div>
  );
};
