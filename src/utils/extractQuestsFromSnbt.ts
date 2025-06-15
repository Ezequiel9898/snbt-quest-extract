
/**
 * Extrai todas as quests de um arquivo .snbt (array "quests": [ ... ]).
 * Retorna cada objeto quest como string.
 */
export function extractQuestsFromSnbt(snbtContent: string): string[] {
  const results: string[] = [];

  // Encontrar início do array quests: [
  const questsStart = snbtContent.indexOf("quests: [");
  if (questsStart === -1) return results;

  // Procurar início efetivo (após o '[')
  const arrStart = snbtContent.indexOf("[", questsStart);
  // Proteger contra erro de formato
  if (arrStart === -1) return results;

  let i = arrStart + 1;
  let insideQuest = false;
  let questDepth = 0;
  let currentQuest = "";

  while (i < snbtContent.length) {
    const c = snbtContent[i];
    // Início de quest: objeto começando com '{', mas apenas dentro do array quests
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
      // detecta final do objeto
      if (questDepth === 0) {
        results.push(currentQuest.trim());
        insideQuest = false;
        currentQuest = "";
      }
    } else {
      // Fim do array quests
      if (c === "]") break;
    }
    i++;
  }

  return results;
}
