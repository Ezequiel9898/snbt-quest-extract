
import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { QuestData } from "@/utils/questExtractor";

interface OptimizedQuestListProps {
  quests: QuestData[];
}

export const OptimizedQuestList: React.FC<OptimizedQuestListProps> = ({ quests }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChapter, setFilterChapter] = useState("all");
  const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set());

  const chapters = useMemo(() => {
    const uniqueChapters = [...new Set(quests.map(q => q.chapter).filter(Boolean))];
    return uniqueChapters.sort();
  }, [quests]);

  const filteredQuests = useMemo(() => {
    return quests.filter(quest => {
      const matchesSearch = !searchTerm || 
        quest.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.description?.some(desc => desc.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesChapter = filterChapter === "all" || quest.chapter === filterChapter;
      
      return matchesSearch && matchesChapter;
    });
  }, [quests, searchTerm, filterChapter]);

  const toggleQuest = (questId: string) => {
    const newExpanded = new Set(expandedQuests);
    if (newExpanded.has(questId)) {
      newExpanded.delete(questId);
    } else {
      newExpanded.add(questId);
    }
    setExpandedQuests(newExpanded);
  };

  if (!quests.length) {
    return null;
  }

  return (
    <Card className="w-full mt-6 mb-2 p-0 bg-card shadow-2xl rounded-xl border-2 border-muted/80 overflow-hidden">
      <div className="p-5 pb-4 border-b bg-card rounded-t-xl">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="text-primary mr-1" size={22} />
          <span className="font-extrabold text-lg tracking-tight text-primary">Quests Extraídas</span>
          <Badge variant="outline" className="ml-auto text-primary bg-primary/10 border-primary/30 text-xs font-bold px-2 py-1">
            {filteredQuests.length} de {quests.length}
          </Badge>
        </div>
        
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Buscar quests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterChapter} onValueChange={setFilterChapter}>
            <SelectTrigger className="w-48">
              <Filter size={16} className="mr-2" />
              <SelectValue placeholder="Filtrar por capítulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os capítulos</SelectItem>
              {chapters.map(chapter => (
                <SelectItem key={chapter} value={chapter!}>{chapter}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <ScrollArea className="h-[400px] w-full">
        <div className="p-4 space-y-3">
          {filteredQuests.map((quest) => {
            const isExpanded = expandedQuests.has(quest.id);
            return (
              <Card key={quest.id} className="bg-muted/50 border hover:border-primary/50 transition-all">
                <div className="p-4">
                  <button
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() => toggleQuest(quest.id)}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {quest.title || `Quest ${quest.id}`}
                      </div>
                      {quest.chapter && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {quest.chapter}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {quest.tasks && <Badge variant="outline" className="text-xs">T:{quest.tasks.length}</Badge>}
                      {quest.rewards && <Badge variant="outline" className="text-xs">R:{quest.rewards.length}</Badge>}
                      {quest.description && <Badge variant="outline" className="text-xs">D:{quest.description.length}</Badge>}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-3 pl-6">
                      {quest.subtitle && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Subtitle:</div>
                          <div className="text-sm bg-background p-2 rounded border">{quest.subtitle}</div>
                        </div>
                      )}
                      
                      {quest.description && quest.description.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Descriptions:</div>
                          <div className="space-y-1">
                            {quest.description.map((desc, i) => (
                              <div key={i} className="text-sm bg-background p-2 rounded border">{desc}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {quest.tasks && quest.tasks.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Tasks:</div>
                          <div className="space-y-1">
                            {quest.tasks.map((task, i) => (
                              <div key={i} className="text-sm bg-background p-2 rounded border">{task}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {quest.rewards && quest.rewards.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Rewards:</div>
                          <div className="space-y-1">
                            {quest.rewards.map((reward, i) => (
                              <div key={i} className="text-sm bg-background p-2 rounded border">{reward}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          
          {filteredQuests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma quest encontrada com os filtros aplicados.
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
