
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, BookOpen, ArrowDown, ArrowUp } from "lucide-react";

interface QuestListProps {
  quests: string[];
}

export const QuestList: React.FC<QuestListProps> = ({ quests }) => {
  // Estado para animar a abertura individual das quests
  const [openStates, setOpenStates] = useState<boolean[]>(
    quests.map(() => quests.length <= 3)
  );

  const toggleQuest = (index: number) => {
    setOpenStates((prev) =>
      prev.map((state, i) => (i === index ? !state : state))
    );
  };

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
            <li
              key={i}
              className="bg-background/70 rounded-md border hover:border-primary transition-all duration-200 shadow-sm group"
            >
              {/* Animated details using Tailwind custom animation */}
              <div className="p-2">
                <button
                  type="button"
                  className="flex w-full items-center cursor-pointer text-sm font-semibold gap-2 group-hover:text-primary transition-colors outline-none"
                  aria-expanded={openStates[i]}
                  aria-controls={`quest-panel-${i}`}
                  onClick={() => toggleQuest(i)}
                >
                  <Info size={16} className="opacity-70" />
                  <span>
                    Quest <span className="font-bold">{i + 1}</span>
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                    {q.length} caracteres
                  </span>
                  {openStates[i] ? (
                    <ArrowUp className="ml-2 opacity-70" size={18} />
                  ) : (
                    <ArrowDown className="ml-2 opacity-70" size={18} />
                  )}
                </button>
                <div
                  id={`quest-panel-${i}`}
                  className={`overflow-hidden transition-all duration-300 ${openStates[i]
                    ? "max-h-[400px] opacity-100 animate-accordion-down"
                    : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  aria-hidden={!openStates[i]}
                >
                  <pre className="whitespace-pre-wrap break-words text-xs rounded bg-muted/80 p-2 mt-1 border">
                    {q}
                  </pre>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </Card>
  );
};
