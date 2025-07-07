import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Info, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const HeaderSection = () => (
  <header className="flex flex-col items-center justify-center gap-6 mb-8 bounce-in">
    <div className="flex flex-col items-center gap-3">
      <h1 className="text-4xl md:text-5xl font-black flex items-center gap-3 tracking-tighter text-center font-orbitron">
        <BookOpen className="text-primary drop-shadow-sm glow" size={40} />
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          ⛏️ FTB Quest Translator
        </span>
        <Badge className="ml-2 minecraft-button text-xs" variant="secondary">
          <Sparkles size={12} className="mr-1" />
          v2.0
        </Badge>
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-3xl text-center leading-relaxed">
        🎮 Ferramenta <span className="font-semibold text-primary">automatizada</span> para tradução de <span className="font-semibold">FTB Quests</span>
        <br />
        Processa arquivos <span className="font-mono px-2 py-1 rounded minecraft-card bg-muted/40">.zip</span> ou <span className="font-mono px-2 py-1 rounded minecraft-card bg-muted/40">.snbt</span> e gera <span className="font-mono px-2 py-1 rounded minecraft-card bg-muted/40">en_us.json</span> pronto para uso!
      </p>
    </div>

    <div className="flex gap-4 fade-in-up">
      <Link to="/about">
        <Button variant="default" size="lg" className="font-semibold">
          <Info size={16} />
          Sobre a Ferramenta
        </Button>
      </Link>
      
      <Button variant="secondary" size="lg" className="font-semibold" onClick={() => {
        document.querySelector('[aria-label="Área para soltar arquivos ZIP ou SNBT"]')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }}>
        <Sparkles size={16} />
        Começar Tradução
      </Button>
    </div>

    <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50"></div>
  </header>
);