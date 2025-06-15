import JSZip from 'jszip';

function decodeValue(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function createTranslationJson(
  allMapeamentos: Array<[string, Record<string, string>]>,
  abbreviation: string
): string {
  const finalJson: Record<string, string> = {};
  for (const [_, mappings] of allMapeamentos) {
    for (const key in mappings) {
      if (mappings.hasOwnProperty(key)) {
        finalJson[key] = mappings[key];
      }
    }
  }
  return JSON.stringify(finalJson, null, 2);
}

function extractModpackName(zip: JSZip): string {
  const mcmanifest = zip.file('manifest.json');
  if (mcmanifest) {
    return JSON.parse(mcmanifest.async('string')).name;
  }
  return 'Modpack';
}

function generateAbbreviation(modpackName: string): string {
  const words = modpackName.split(' ');
  let abbreviation = '';
  for (const word of words) {
    abbreviation += word.charAt(0).toUpperCase();
  }
  return abbreviation;
}

export async function processModpackZip(zipData: Uint8Array) {
  const logLines: string[] = [];
  const JSZip = (await import("jszip")).default;
  
  try {
    const zip = await JSZip.loadAsync(zipData);
    const modpackName = extractModpackName(zip);
    const abbreviation = generateAbbreviation(modpackName);
    
    logLines.push(`Modpack: ${modpackName} (${abbreviation})`);
    
    const outputZip = new JSZip();
    const allMapeamentos: Array<[string, Record<string, string>]> = [];
    
    const snbtFiles = Object.keys(zip.files)
      .filter(path => path.includes('config/ftbquests/quests/') && path.endsWith('.snbt'))
      .sort();
    
    for (const filePath of snbtFiles) {
      const file = zip.files[filePath];
      if (file.dir) continue;
      
      logLines.push(`\n→ ${filePath}`);
      
      const content = await file.async("string");
      const relativePath = filePath.replace(/^.*config\/ftbquests\/quests\//, '');
      
      const { modifiedContent, mappings } = processSnbtContent(
        content, 
        relativePath, 
        'config/ftbquests/quests', 
        abbreviation
      );
      
      outputZip.file(`output/${filePath}`, modifiedContent);
      allMapeamentos.push([relativePath, mappings]);
      
      logLines.push("  ✓ OK");
    }
    
    if (allMapeamentos.length > 0) {
      const jsonResult = createTranslationJson(allMapeamentos, abbreviation);
      outputZip.file("output/en_us.json", jsonResult);
      logLines.push("\n✓ Translations saved to: en_us.json");
      
      return {
        logLines,
        outputZip,
        jsonResult
      };
    } else {
      logLines.push("\n! No translatable text found");
      return {
        logLines,
        outputZip,
        jsonResult: "{}"
      };
    }
    
  } catch (error) {
    logLines.push(`\n! Error: ${error}`);
    throw error;
  }
}

function processSnbtContent(
  content: string, 
  relativePath: string, 
  filterDirectory: string, 
  abbreviation: string
): { modifiedContent: string; mappings: Record<string, string> } {
  
  const lines = content.split('\n');
  const modifiedLines: string[] = [];
  const mappings: Record<string, string> = {};
  
  const currentFilename = relativePath.split('/').pop() || '';
  const fileId = currentFilename.endsWith('.snbt') 
    ? currentFilename.replace('.snbt', '') 
    : null;
  
  const pathParts = relativePath.split('/');
  const chapterFolder = pathParts.length > 1 ? pathParts[0] : null;
  
  let braceDepth = 0;
  let questTitleCounter = 1;
  let questSubtitleCounter = 1;
  let questDescCounter = 1;
  let rewardTitleCounter = 1;
  let taskTitleCounter = 1;
  let chapterGroupTitleCounter = 1;
  let withinDescription = false;
  let descTempLines: string[] = [];
  
  let currentContext: string | null = null;
  
  for (const line of lines) {
    const stripped = line.trim();
    
    if (stripped.startsWith('tasks: [')) {
      currentContext = 'tasks';
    } else if (stripped.startsWith('rewards: [')) {
      currentContext = 'rewards';
    } else if (stripped === ']') {
      currentContext = null;
    }
    
    const openBraces = (line.match(/[{\[]/g) || []).length;
    const closeBraces = (line.match(/[}\]]/g) || []).length;
    braceDepth += openBraces - closeBraces;
    
    // Handle inline description arrays
    if (/^\s*description:\s*\[.*\]\s*$/.test(line)) {
      const indent = line.match(/^(\s*)/)![1];
      const descriptions = line.match(/"((?:[^"\\]|\\.)*)"/g) || [];
      const novasLinhas = [indent + 'description: ['];
      
      descriptions.forEach(desc => {
        const value = desc.slice(1, -1); // Remove quotes
        const key = `${abbreviation}.quests.${chapterFolder}.${fileId}.desc${questDescCounter}`;
        mappings[key] = decodeValue(value);
        novasLinhas.push(`${indent}  "{${key}}"`);
        questDescCounter++;
      });
      
      novasLinhas.push(indent + ']');
      modifiedLines.push(...novasLinhas);
      continue;
    }
    
    // Handle multiline description arrays
    if (line.includes('description: [')) {
      withinDescription = true;
      descTempLines = [];
      modifiedLines.push(line);
      continue;
    }
    
    if (withinDescription) {
      if (line.includes(']')) {
        withinDescription = false;
        modifiedLines.push(...descTempLines);
        modifiedLines.push(line);
        continue;
      }
      
      const descMatch = line.match(/^(\s*)"((?:[^"\\]|\\.)*)"\s*$/);
      if (descMatch) {
        const indent = descMatch[1];
        const originalValue = descMatch[2];
        const key = `${abbreviation}.quests.${chapterFolder}.${fileId}.desc${questDescCounter}`;
        mappings[key] = decodeValue(originalValue);
        descTempLines.push(`${indent}"{${key}}"`);
        questDescCounter++;
        continue;
      }
    }
    
    // Handle chapter_groups.snbt title replacements
    if (currentFilename === 'chapter_groups.snbt') {
      const newLine = line.replace(/title:\s*"((?:[^"\\]|\\.)*)"/g, (match, value) => {
        const key = `${abbreviation}.chapter_groups.title${chapterGroupTitleCounter}`;
        chapterGroupTitleCounter++;
        mappings[key] = decodeValue(value);
        return `title: "{${key}}"`;
      });
      modifiedLines.push(newLine);
      continue;
    }
    
    // Handle context-specific titles (rewards/tasks)
    const titleMatch = line.match(/^(\s*)title:\s*"((?:[^"\\]|\\.)*)"\s*$/);
    if (titleMatch) {
      const indent = titleMatch[1];
      const originalValue = titleMatch[2];
      const decodedValue = decodeValue(originalValue);
      
      if (currentContext === 'rewards') {
        const key = `${abbreviation}.quests.${chapterFolder}.${fileId}.reward${rewardTitleCounter}`;
        rewardTitleCounter++;
        mappings[key] = decodedValue;
        modifiedLines.push(`${indent}title: "{${key}}"`);
        continue;
      } else if (currentContext === 'tasks') {
        const key = `${abbreviation}.quests.${chapterFolder}.${fileId}.task${taskTitleCounter}`;
        taskTitleCounter++;
        mappings[key] = decodedValue;
        modifiedLines.push(`${indent}title: "{${key}}"`);
        continue;
      }
    }
    
    // Handle general title/subtitle
    let modified = false;
    for (const type of ['title', 'subtitle']) {
      const match = line.match(new RegExp(`^(\\s*)${type}:\\s*"((?:[^"\\\\]|\\\\.)*)"\\s*$`));
      if (match) {
        const indent = match[1];
        const originalValue = match[2];
        
        if (/\{ftbquests\./.test(originalValue)) {
          break;
        }
        
        let key: string;
        if (currentFilename === 'data.snbt') {
          key = `${abbreviation}.modpack.${type}`;
        } else if (chapterFolder && fileId && braceDepth <= 2) {
          key = `${abbreviation}.${chapterFolder}.${fileId}.${type}`;
        } else if (chapterFolder && fileId && braceDepth > 2) {
          const counter = type === 'title' ? questTitleCounter : questSubtitleCounter;
          key = `${abbreviation}.quests.${chapterFolder}.${fileId}.${type}${counter}`;
          if (type === 'title') {
            questTitleCounter++;
          } else {
            questSubtitleCounter++;
          }
        } else {
          break;
        }
        
        mappings[key] = decodeValue(originalValue);
        modifiedLines.push(`${indent}${type}: "{${key}}"`);
        modified = true;
        break;
      }
    }
    
    if (!modified && !withinDescription) {
      modifiedLines.push(line);
    }
  }
  
  return {
    modifiedContent: modifiedLines.join('\n'),
    mappings
  };
}
