
import React from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { ProcessingConsoleLog } from "@/components/ProcessingConsoleLog";
import { QuestList } from "@/components/QuestList";
import { HowItWorksSection } from "@/components/HowItWorksSection";

interface LeftPanelProps {
  onFilesAccepted: (files: File[]) => void;
  processing: boolean;
  logLines: string[];
  extractedQuests: string[];
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  onFilesAccepted,
  processing,
  logLines,
  extractedQuests
}) => (
  <div className="flex flex-col gap-6">
    <FileDropZone onFilesAccepted={onFilesAccepted} processing={processing} />
    <HowItWorksSection />
    <ProcessingConsoleLog logLines={logLines} />
    <QuestList quests={extractedQuests} />
  </div>
);
