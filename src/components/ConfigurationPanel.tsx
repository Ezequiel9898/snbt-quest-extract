import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Settings, Folder, Download, FileText, FolderOpen, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConfigurationPanelProps {
  config: ProcessingConfig;
  onConfigChange: (config: ProcessingConfig) => void;
}

export interface ProcessingConfig {
  filterDirectory: string;
  outputFormat: 'json' | 'properties' | 'yaml';
  includeEmptyValues: boolean;
  generateBackup: boolean;
  customPrefix: string;
  preserveFormatting: boolean;
  sortKeys: boolean;
  compressOutput: boolean;
  includeMetadata: boolean;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ config, onConfigChange }) => {
  const folderInputRef = useRef<HTMLInputElement>(null);

  const updateConfig = (key: keyof ProcessingConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleFolderSelect = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Pega o caminho da primeira pasta selecionada
      const firstFile = files[0];
      const webkitPath = firstFile.webkitRelativePath;
      if (webkitPath) {
        // Extrai apenas a parte do diretório
        const pathParts = webkitPath.split('/');
        const questsIndex = pathParts.indexOf('quests');
        if (questsIndex !== -1 && questsIndex > 0) {
          const dirPath = pathParts.slice(0, questsIndex + 1).join('/');
          updateConfig('filterDirectory', dirPath);
        } else {
          // Se não encontrar 'quests', usa o primeiro diretório
          const dirPath = pathParts.slice(0, -1).join('/');
          updateConfig('filterDirectory', dirPath);
        }
      }
    }
  };

  const InfoTooltip = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Card className="w-full minecraft-card bounce-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary font-bold">
          <Settings size={20} />
          ⚙️ Configurações de Processamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-4 fade-in-up">
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-accent" />
            <Label className="font-semibold text-lg">📁 Diretórios</Label>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="filterDir">Diretório de Quests</Label>
                <InfoTooltip content="Pasta onde estão localizados os arquivos .snbt das quests. Geralmente: config/ftbquests/quests" />
              </div>
              <div className="flex gap-2">
                <Input
                  id="filterDir"
                  value={config.filterDirectory}
                  onChange={(e) => updateConfig('filterDirectory', e.target.value)}
                  placeholder="config/ftbquests/quests"
                  className="minecraft-card border-2"
                />
                <Button 
                  type="button" 
                  onClick={handleFolderSelect}
                  variant="outline"
                  className="minecraft-button whitespace-nowrap"
                >
                  <FolderOpen size={16} />
                  Selecionar Pasta
                </Button>
              </div>
              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderChange}
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="customPrefix">🏷️ Prefixo Personalizado</Label>
                <InfoTooltip content="Prefixo usado nas chaves de tradução. Ex: 'meumod' gerará chaves como 'meumod.quests.chapter1.quest1.title'. Se vazio, será gerado automaticamente baseado no nome da pasta." />
              </div>
              <Input
                id="customPrefix"
                value={config.customPrefix}
                onChange={(e) => updateConfig('customPrefix', e.target.value)}
                placeholder="Ex: meumodpack, abbreviacao, etc..."
                className="minecraft-card border-2"
              />
            </div>
          </div>
        </div>

        <Separator className="border-border" />

        <div className="space-y-4 fade-in-up">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-accent" />
            <Label className="font-semibold text-lg">💾 Formato de Saída</Label>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Formato do Arquivo</Label>
                <InfoTooltip content="Formato do arquivo de traduções gerado. JSON é o mais comum para Minecraft." />
              </div>
              <Select value={config.outputFormat} onValueChange={(value: any) => updateConfig('outputFormat', value)}>
                <SelectTrigger className="minecraft-card border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="minecraft-card">
                  <SelectItem value="json">📄 JSON (.json)</SelectItem>
                  <SelectItem value="properties">📋 Properties (.properties)</SelectItem>
                  <SelectItem value="yaml">📝 YAML (.yml)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-3 minecraft-card rounded">
              <div className="flex items-center gap-2">
                <Label htmlFor="compressOutput">🗜️ Comprimir Saída (ZIP)</Label>
                <InfoTooltip content="Gera um arquivo ZIP com todos os arquivos processados" />
              </div>
              <Switch
                id="compressOutput"
                checked={config.compressOutput}
                onCheckedChange={(checked) => updateConfig('compressOutput', checked)}
              />
            </div>
          </div>
        </div>

        <Separator className="border-border" />

        <div className="space-y-4 fade-in-up">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-accent" />
            <Label className="font-semibold text-lg">📝 Opções de Conteúdo</Label>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 minecraft-card rounded">
              <div className="flex items-center gap-2">
                <Label htmlFor="includeEmpty">Incluir Valores Vazios</Label>
                <InfoTooltip content="Inclui no arquivo de tradução campos que estão vazios ou em branco" />
              </div>
              <Switch
                id="includeEmpty"
                checked={config.includeEmptyValues}
                onCheckedChange={(checked) => updateConfig('includeEmptyValues', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 minecraft-card rounded">
              <div className="flex items-center gap-2">
                <Label htmlFor="preserveFormat">Preservar Formatação Original</Label>
                <InfoTooltip content="Mantém a formatação original dos arquivos SNBT (espaços, quebras de linha, etc.)" />
              </div>
              <Switch
                id="preserveFormat"
                checked={config.preserveFormatting}
                onCheckedChange={(checked) => updateConfig('preserveFormatting', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 minecraft-card rounded">
              <div className="flex items-center gap-2">
                <Label htmlFor="sortKeys">Ordenar Chaves Alfabeticamente</Label>
                <InfoTooltip content="Organiza as chaves de tradução em ordem alfabética no arquivo final" />
              </div>
              <Switch
                id="sortKeys"
                checked={config.sortKeys}
                onCheckedChange={(checked) => updateConfig('sortKeys', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 minecraft-card rounded">
              <div className="flex items-center gap-2">
                <Label htmlFor="includeMetadata">📊 Incluir Metadados</Label>
                <InfoTooltip content="Adiciona informações extras como data de processamento, quantidade de arquivos, etc." />
              </div>
              <Switch
                id="includeMetadata"
                checked={config.includeMetadata}
                onCheckedChange={(checked) => updateConfig('includeMetadata', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 minecraft-card rounded">
              <div className="flex items-center gap-2">
                <Label htmlFor="generateBackup">💾 Gerar Backup dos Originais</Label>
                <InfoTooltip content="Cria uma cópia dos arquivos originais antes de modificá-los" />
              </div>
              <Switch
                id="generateBackup"
                checked={config.generateBackup}
                onCheckedChange={(checked) => updateConfig('generateBackup', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};