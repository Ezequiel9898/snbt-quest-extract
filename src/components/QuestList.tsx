
import React from "react";
import { Card } from "@/components/ui/card";

interface QuestListProps {
  quests: string[];
}

export const QuestList: React.FC<QuestListProps> = ({ quests }) => {
  if (!quests.length) {
    return null;
  }

  return (
    <Card className="w-full mt-4 mb-2 px-6 py-4 bg-muted font-mono text-[0.98rem] text-left max-h-72 overflow-auto shadow">
      <div className="font-bold mb-2">Quests extraídas:</div>
      {quests.map((q, i) => (
        <details key={i} className="mb-2">
          <summary className="cursor-pointer text-sm font-semibold">Quest {i + 1}</summary>
          <pre className="whitespace-pre-wrap break-words text-xs">{q}</pre>
        </details>
      ))}
    </Card>
  );
};
