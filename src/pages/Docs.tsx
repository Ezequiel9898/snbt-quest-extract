import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Download, Settings } from "lucide-react";

const Docs = () => {
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
          <h1 className="text-4xl font-bold mb-4">Documentação</h1>
          <p className="text-xl text-muted-foreground">
            Aprenda como usar o FTB Quest Translator
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                O FTB Quest Translator extrai textos traduzíveis dos arquivos .snbt e gera um arquivo en_us.json pronto para uso.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Faça upload do arquivo ZIP do modpack ou arquivos .snbt individuais</li>
                <li>Configure as opções de processamento (opcional)</li>
                <li>Aguarde o processamento</li>
                <li>Baixe o arquivo traduzido</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Diretório de Filtro</h4>
                  <p className="text-sm text-muted-foreground">
                    Especifica qual pasta dentro do ZIP será processada. Padrão: config/ftbquests/quests
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Formato de Saída</h4>
                  <p className="text-sm text-muted-foreground">
                    Escolha entre JSON padrão ou ZIP completo com arquivos modificados.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Prefixo Personalizado</h4>
                  <p className="text-sm text-muted-foreground">
                    Adiciona um prefixo personalizado às chaves de tradução. Útil para organização.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Tipos de Arquivo Suportados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>.zip</strong> - Arquivo completo do modpack</li>
                <li><strong>.snbt</strong> - Arquivos individuais de quest</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Docs;