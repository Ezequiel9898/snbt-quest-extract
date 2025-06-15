
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, BookOpen } from "lucide-react";

interface QuestListProps {
  quests: string[];
}

export const QuestList: React.FC<QuestListProps> = ({ quests }) => {
  if (!quests.length) {
    return null;
  }

  return (
    <Card className="w-full mt-4 mb-2 p-0 bg-muted shadow-lg rounded-lg border-2 border-muted">
      <div className="flex items-center gap-2 p-4 pb-2 border-b">
        <BookOpen className="text-primary mr-1" size={20} />
        <span className="font-bold text-base">Quests extraídas</span>
        <Badge variant="outline" className="ml-auto">{quests.length}</Badge>
      </div>
      <ScrollArea className="max-h-72 px-2 py-2">
        <ul className="space-y-2">
          {quests.map((q, i) => (
            <li key={i} className="bg-background/70 rounded-md border hover:border-primary transition-all duration-200 shadow-sm group">
              <details
                className="p-2"
                open={quests.length <= 3}
              >
                <summary className="flex items-center cursor-pointer text-sm font-semibold gap-2 group-hover:text-primary transition-colors">
                  <Info size={16} className="opacity-70" />
                  <span>
                    Quest <span className="font-bold">{i + 1}</span>
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{q.length} caracteres</span>
                </summary>
                <pre className="whitespace-pre-wrap break-words text-xs rounded bg-muted/80 p-2 mt-1 border">{q}</pre>
              </details>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </Card>
  );
};
