
import React from "react";
import { Card } from "@/components/ui/card";

interface ProcessingLogProps {
  logLines: string[];
}

export const ProcessingLog: React.FC<ProcessingLogProps> = ({ logLines }) => {
  if (!logLines.length) return null;
  return (
    <Card className="w-full mt-4 mb-2 px-6 py-4 bg-muted font-mono text-[0.98rem] text-left max-h-72 overflow-auto shadow">
      {logLines.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap">{line}</div>
      ))}
    </Card>
  );
}
