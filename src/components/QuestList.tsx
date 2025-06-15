
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, BookOpen, ArrowDown, ArrowUp } from "lucide-react";

interface QuestListProps {
  quests: string[];
}

export const QuestList: React.FC<QuestListProps> = ({ quests }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setOpenIndex(null);
  }, [quests]);

  const toggleQuest = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  if (!quests.length) {
    return null;
  }

  return (
    <Card className="w-full mt-6 mb-2 p-0 bg-card shadow-2xl rounded-xl border-2 border-muted/80 overflow-hidden transition hover:shadow-2xl hover:border-primary/50">
      <div className="flex items-center gap-2 p-5 pb-2 border-b bg-card rounded-t-xl">
        <BookOpen className="text-primary mr-1" size={22} />
        <span className="font-extrabold text-lg tracking-tight text-primary">Quests extraídas</span>
        <Badge variant="outline" className="ml-auto text-primary bg-primary/10 border-primary/30 text-xs font-bold px-2 py-1">
          {quests.length}
        </Badge>
      </div>
      <ScrollArea className="h-[420px] md:h-[350px] w-full">
        <div className="px-3 pt-5 pb-5 w-full md:w-[92%] mx-auto bg-background border border-muted/40 rounded-xl shadow-inner">
          <ul className="space-y-3">
            {quests.map((q, i) => (
              <li
                key={i}
                className="bg-muted rounded-lg border hover:border-primary transition-all duration-200 shadow group"
              >
                <div className="p-3">
                  <button
                    type="button"
                    className="flex w-full items-center text-sm font-semibold gap-2 group-hover:text-primary transition-colors outline-none"
                    aria-expanded={openIndex === i}
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
                    {openIndex === i ? (
                      <ArrowUp className="ml-2 opacity-70" size={18} />
                    ) : (
                      <ArrowDown className="ml-2 opacity-70" size={18} />
                    )}
                  </button>
                  <div
                    id={`quest-panel-${i}`}
                    aria-hidden={openIndex !== i}
                    className={`w-full origin-top transition-all duration-300 ${
                      openIndex === i
                        ? "opacity-100 scale-y-100 pointer-events-auto max-h-72"
                        : "opacity-0 scale-y-95 pointer-events-none max-h-0"
                    }`}
                    style={{
                      transform: openIndex === i ? "scaleY(1)" : "scaleY(0.97)",
                      overflow: "hidden",
                    }}
                  >
                    {openIndex === i && (
                      <div className="relative">
                        <pre
                          className="whitespace-pre-wrap break-words text-xs rounded bg-muted p-3 mt-1 border border-muted/40 font-mono leading-snug overflow-hidden"
                          style={{ maxHeight: "300px" }}
                        >
                          {q}
                        </pre>
                        <div
                          className="pointer-events-none absolute bottom-0 left-0 w-full h-8"
                          style={{
                            background:
                              "linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(230,230,245,0.19) 80%,rgba(230,230,245,0.82) 100%)",
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                            display: q.length > 340 ? "block" : "none"
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>
    </Card>
  );
};
