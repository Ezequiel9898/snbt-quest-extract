
import React from "react";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export const HeaderSection = () => (
  <header className="flex flex-col items-center justify-center gap-3 mb-6">
    <h1 className="text-3xl md:text-4xl font-black flex items-center gap-2 tracking-tighter text-center">
      <BookOpen className="text-primary drop-shadow-sm" size={36} />
      FTB Quests Tradutor Automático
      <Badge className="ml-2" variant="secondary">Beta</Badge>
    </h1>
    <p className="text-base text-muted-foreground max-w-2xl text-center leading-relaxed">
      Faça upload dos arquivos <span className="font-semibold">.zip</span> ou <span className="font-semibold">.snbt</span> contendo <span className="font-mono px-1 py-0.5 rounded bg-muted/40">config/ftbquests/quests/*.snbt</span>
      e baixe os arquivos já <span className="font-semibold text-primary">mapeados para tradução</span> e o <span className="font-mono px-1 py-0.5 rounded bg-muted/40">en_us.json</span>.
    </p>
  </header>
);
