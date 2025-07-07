import React from "react";
import { ArrowLeft, Sparkles, Zap, Shield, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <ThemeToggle />
      
      <div className="flex-1 flex flex-col py-8 px-4 md:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8 bounce-in">
          <Link to="/">
            <Button variant="grass" className="mb-4">
              <ArrowLeft size={16} />
              Voltar
            </Button>
          </Link>
          
          <h1 className="text-4xl font-bold text-primary mb-4 font-orbitron">
            🎮 Sobre o FTB Quest Translator
          </h1>
          <p className="text-lg text-muted-foreground">
            Ferramenta especializada para tradução de FTB Quests no Minecraft
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="quest-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="text-accent" />
                ✨ Recursos Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Processamento automático de arquivos .snbt</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Extração de títulos, descrições, tarefas e recompensas</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Geração de chaves de tradução organizadas</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Suporte para arquivos ZIP e pastas</span>
              </div>
            </CardContent>
          </Card>

          <Card className="quest-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Zap className="text-accent" />
                ⚡ Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Processamento rápido de grandes modpacks</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Interface responsiva e intuitiva</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Preview em tempo real das quests extraídas</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Logs detalhados do processamento</span>
              </div>
            </CardContent>
          </Card>

          <Card className="quest-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Shield className="text-accent" />
                🛡️ Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Processamento 100% local no navegador</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Nenhum arquivo é enviado para servidores</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Backup automático dos arquivos originais</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Código aberto e transparente</span>
              </div>
            </CardContent>
          </Card>

          <Card className="quest-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Code className="text-accent" />
                💻 Tecnologia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Construído com React + TypeScript</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Design system inspirado no Minecraft</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Animações fluidas e responsivas</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>Tema claro/escuro automático</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="quest-card mb-8">
          <CardHeader>
            <CardTitle className="text-primary text-center">
              🎯 Como Usar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 minecraft-card rounded">
                <div className="text-3xl mb-2">📁</div>
                <h3 className="font-semibold mb-2">1. Selecione os Arquivos</h3>
                <p className="text-sm text-muted-foreground">
                  Arraste um ZIP do modpack ou selecione a pasta de quests
                </p>
              </div>
              
              <div className="text-center p-4 minecraft-card rounded">
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="font-semibold mb-2">2. Configure as Opções</h3>
                <p className="text-sm text-muted-foreground">
                  Ajuste formato, diretórios e outras preferências
                </p>
              </div>
              
              <div className="text-center p-4 minecraft-card rounded">
                <div className="text-3xl mb-2">💾</div>
                <h3 className="font-semibold mb-2">3. Baixe o Resultado</h3>
                <p className="text-sm text-muted-foreground">
                  Receba os arquivos traduzidos prontos para uso
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center fade-in-up">
          <p className="text-muted-foreground mb-4">
            Desenvolvido com ❤️ para a comunidade Minecraft
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="diamond" size="lg">
              <Sparkles size={16} />
              Começar Agora
            </Button>
            <Link to="/">
              <Button variant="stone" size="lg">
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;