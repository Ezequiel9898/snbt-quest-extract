
// Utilitário otimizado para extrair quests com conteúdo válido
export interface QuestData {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string[];
  tasks?: string[];
  rewards?: string[];
  chapter?: string;
  hasContent: boolean;
}

export function extractValidQuests(snbtContent: string, filePath: string = ''): QuestData[] {
  const results: QuestData[] = [];
  
  // Encontrar início do array quests
  const questsStart = snbtContent.indexOf("quests: [");
  if (questsStart === -1) return results;

  const arrStart = snbtContent.indexOf("[", questsStart);
  if (arrStart === -1) return results;

  let i = arrStart + 1;
  let insideQuest = false;
  let questDepth = 0;
  let currentQuest = "";
  let questIndex = 0;

  while (i < snbtContent.length) {
    const c = snbtContent[i];
    
    if (!insideQuest && c === "{") {
      insideQuest = true;
      questDepth = 1;
      currentQuest = "{";
      i++;
      continue;
    }
    
    if (insideQuest) {
      currentQuest += c;
      if (c === "{") questDepth++;
      if (c === "}") questDepth--;
      
      if (questDepth === 0) {
        const questData = parseQuestContent(currentQuest, questIndex, filePath);
        
        // Só adiciona se tiver conteúdo válido
        if (questData.hasContent) {
          results.push(questData);
        }
        
        insideQuest = false;
        currentQuest = "";
        questIndex++;
      }
    } else {
      if (c === "]") break;
    }
    i++;
  }

  return results;
}

function parseQuestContent(questContent: string, index: number, filePath: string): QuestData {
  const questData: QuestData = {
    id: `quest_${index + 1}`,
    hasContent: false,
    chapter: extractChapterFromPath(filePath)
  };

  // Extrair title
  const titleMatch = questContent.match(/title:\s*"([^"]+)"/);
  if (titleMatch) {
    questData.title = titleMatch[1];
    questData.hasContent = true;
  }

  // Extrair subtitle
  const subtitleMatch = questContent.match(/subtitle:\s*"([^"]+)"/);
  if (subtitleMatch) {
    questData.subtitle = subtitleMatch[1];
    questData.hasContent = true;
  }

  // Extrair descriptions
  const descMatches = questContent.match(/description:\s*\[(.*?)\]/s);
  if (descMatches) {
    const descriptions = [...descMatches[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
    if (descriptions.length > 0) {
      questData.description = descriptions;
      questData.hasContent = true;
    }
  }

  // Extrair tasks
  const tasksMatch = questContent.match(/tasks:\s*\[(.*?)\]/s);
  if (tasksMatch) {
    const taskTitles = [...tasksMatch[1].matchAll(/title:\s*"([^"]+)"/g)].map(m => m[1]);
    if (taskTitles.length > 0) {
      questData.tasks = taskTitles;
      questData.hasContent = true;
    }
  }

  // Extrair rewards
  const rewardsMatch = questContent.match(/rewards:\s*\[(.*?)\]/s);
  if (rewardsMatch) {
    const rewardTitles = [...rewardsMatch[1].matchAll(/title:\s*"([^"]+)"/g)].map(m => m[1]);
    if (rewardTitles.length > 0) {
      questData.rewards = rewardTitles;
      questData.hasContent = true;
    }
  }

  return questData;
}

function extractChapterFromPath(filePath: string): string | undefined {
  const parts = filePath.split('/');
  const questsIndex = parts.indexOf('quests');
  if (questsIndex !== -1 && questsIndex + 1 < parts.length) {
    return parts[questsIndex + 1];
  }
  return undefined;
}
