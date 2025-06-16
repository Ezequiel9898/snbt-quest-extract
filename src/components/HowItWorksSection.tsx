
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, ArrowDown, Check, ArrowUp, FileText, FileDown } from "lucide-react";

const Step = ({ icon, text, className }: { icon: React.ReactNode; text: React.ReactNode; className?: string }) => (
  <div className={`flex items-start gap-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg px-4 py-3 border border-muted/30 hover:border-primary/30 transition-all duration-200 ${className ?? ""}`}>
    <div className="flex-shrink-0 mt-0.5 p-1.5 bg-background rounded-md shadow-sm border border-muted/40">
      {icon}
    </div>
    <span className="text-sm leading-relaxed text-foreground/90">{text}</span>
  </div>
);

const ComoFuncionaSteps = () => (
  <div className="flex flex-col gap-3">
    <Step
      icon={<ArrowDown size={16} className="text-blue-500" />}
      text={
        <>
          Arraste o arquivo <span className="font-semibold bg-primary/10 px-1 py-0.5 rounded text-primary">modpack.zip</span> ou arquivos <span className="font-semibold bg-primary/10 px-1 py-0.5 rounded text-primary">.snbt</span>
        </>
      }
    />
    <Step
      icon={<Check size={16} className="text-green-600 dark:text-green-400" />}
      text={
        <>
          Extrai textos dos arquivos dentro de <span className="font-mono text-xs bg-muted/60 px-1 py-0.5 rounded">config/ftbquests/quests</span>
        </>
      }
    />
    <Step
      icon={<ArrowUp size={16} className="text-primary" />}
      text={
        <>
          Converte em chaves como <span className="font-mono text-xs bg-accent/60 px-1 py-0.5 rounded">ptnq.quests.intro.title</span>
        </>
      }
    />
    <Step
      icon={<FileText size={16} className="text-violet-600 dark:text-violet-400" />}
      text={
        <>
          Gera o <span className="font-mono text-xs bg-violet-100 dark:bg-violet-900/30 px-1 py-0.5 rounded text-violet-700 dark:text-violet-300">en_us.json</span> para tradução
        </>
      }
    />
    <Step
      icon={<FileDown size={16} className="text-orange-600 dark:text-orange-400" />}
      text={
        <>
          Baixe os arquivos <span className="font-semibold">.snbt processados</span> e o JSON
        </>
      }
    />
  </div>
);

export const HowItWorksSection = () => (
  <Card className="w-full bg-gradient-to-br from-card via-card to-muted/20 shadow-lg border-2 border-muted/60 rounded-xl overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Info className="text-primary" size={18} />
      </div>
      <span className="font-bold text-lg tracking-tight text-foreground">Como funciona?</span>
    </div>
    <div className="p-5 space-y-4">
      <ComoFuncionaSteps />
      <div className="mt-5 pt-4 border-t border-muted/30">
        <div className="text-center">
          <h4 className="font-semibold text-sm text-muted-foreground mb-3">Características</h4>
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <Check size={12} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <span>Compatível com modpacks FTB modernos</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <Check size={12} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <span>Processamento 100% local no navegador</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <Check size={12} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <span>Baseado no script Python original</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
);
