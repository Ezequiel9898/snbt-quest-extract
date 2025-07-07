import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Wrench, FileCode, Archive, Zap } from "lucide-react";

const Tools = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Ferramentas</h1>
          <p className="text-xl text-muted-foreground">
            Ferramentas adicionais para modpack creators
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Validador SNBT
              </CardTitle>
              <CardDescription>
                Valida a sintaxe dos arquivos SNBT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Verifica se seus arquivos .snbt estão com a sintaxe correta antes do processamento.
              </p>
              <Button disabled variant="outline" className="w-full">
                Em Breve
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Compressor ZIP
              </CardTitle>
              <CardDescription>
                Comprime arquivos para upload mais rápido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Otimiza seus arquivos ZIP para processamento mais eficiente.
              </p>
              <Button disabled variant="outline" className="w-full">
                Em Breve
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Conversor Batch
              </CardTitle>
              <CardDescription>
                Processa múltiplos modpacks de uma vez
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ideal para quem trabalha com vários modpacks simultaneamente.
              </p>
              <Button disabled variant="outline" className="w-full">
                Em Breve
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Editor de Quests
              </CardTitle>
              <CardDescription>
                Interface visual para editar quests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Edite suas quests visualmente sem mexer nos arquivos .snbt.
              </p>
              <Button disabled variant="outline" className="w-full">
                Em Breve
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Tools;