
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Folder, Download, FileText } from "lucide-react";

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
  const updateConfig = (key: keyof ProcessingConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings size={20} />
          Configurações de Processamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Folder size={16} />
            <Label className="font-semibold">Diretórios</Label>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="filterDir">Diretório de Filtro</Label>
              <Input
                id="filterDir"
                value={config.filterDirectory}
                onChange={(e) => updateConfig('filterDirectory', e.target.value)}
                placeholder="config/ftbquests/quests"
              />
            </div>
            
            <div>
              <Label htmlFor="customPrefix">Prefixo Personalizado</Label>
              <Input
                id="customPrefix"
                value={config.customPrefix}
                onChange={(e) => updateConfig('customPrefix', e.target.value)}
                placeholder="Deixe vazio para auto-gerar"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Download size={16} />
            <Label className="font-semibold">Formato de Saída</Label>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label>Formato do Arquivo</Label>
              <Select value={config.outputFormat} onValueChange={(value: any) => updateConfig('outputFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                  <SelectItem value="properties">Properties (.properties)</SelectItem>
                  <SelectItem value="yaml">YAML (.yml)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="compressOutput">Comprimir Saída (ZIP)</Label>
              <Switch
                id="compressOutput"
                checked={config.compressOutput}
                onCheckedChange={(checked) => updateConfig('compressOutput', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={16} />
            <Label className="font-semibold">Opções de Conteúdo</Label>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="includeEmpty">Incluir Valores Vazios</Label>
              <Switch
                id="includeEmpty"
                checked={config.includeEmptyValues}
                onCheckedChange={(checked) => updateConfig('includeEmptyValues', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="preserveFormat">Preservar Formatação Original</Label>
              <Switch
                id="preserveFormat"
                checked={config.preserveFormatting}
                onCheckedChange={(checked) => updateConfig('preserveFormatting', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sortKeys">Ordenar Chaves Alfabeticamente</Label>
              <Switch
                id="sortKeys"
                checked={config.sortKeys}
                onCheckedChange={(checked) => updateConfig('sortKeys', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="includeMetadata">Incluir Metadados</Label>
              <Switch
                id="includeMetadata"
                checked={config.includeMetadata}
                onCheckedChange={(checked) => updateConfig('includeMetadata', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="generateBackup">Gerar Backup dos Originais</Label>
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
