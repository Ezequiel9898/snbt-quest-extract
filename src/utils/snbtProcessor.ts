
import JSZip from 'jszip';

function decodeValue(value: string): string {
  // Simular o comportamento do Python's encode('latin-1').decode('unicode_escape')
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function generateAbbreviation(name: string): string {
  const words = name.split(/[\W_]+/).filter(word => word.trim() !== '');
  if (!words.length) {
    return 'modpack';
  }

  const abbrev: string[] = [];
  
  // Para todos os words exceto o último, pegar primeira letra
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i]) {
      abbrev.push(words[i][0].toLowerCase());
    }
  }
  
  // Para a última palavra, se for número mantém, senão primeira letra
  const lastWord = words[words.length - 1];
  if (lastWord) {
    abbrev.push(/^\d+$/.test(lastWord) ? lastWord : lastWord[0].toLowerCase());
  }

  return abbrev.join('') || 'modpack';
}

function generateFileAbbreviation(filename: string): string {
  // Se o nome tem 4 ou menos letras, usar o nome completo
  if (filename.length <= 4) {
    return filename.toLowerCase();
  }
  
  // Senão, abreviar para 4 letras
  const words = filename.split(/[\W_]+/).filter(word => word.trim() !== '');
  if (!words.length) {
    return filename.substring(0, 4).toLowerCase();
  }
  
  if (words.length === 1) {
    return words[0].substring(0, 4).toLowerCase();
  }
  
  // Pegar primeira letra de cada palavra até ter 4 letras
  let abbrev = '';
  for (const word of words) {
    if (abbrev.length < 4 && word.length > 0) {
      abbrev += word[0].toLowerCase();
    }
  }
  
  // Se ainda não tem 4 letras, completar com letras da primeira palavra
  if (abbrev.length < 4 && words[0].length > 1) {
    const firstWord = words[0].toLowerCase();
    for (let i = 1; i < firstWord.length && abbrev.length < 4; i++) {
      abbrev += firstWord[i];
    }
  }
  
  return abbrev.padEnd(4, 'x').substring(0, 4);
}

function createTranslationJson(
  allMapeamentos: Array<[string, Record<string, string>]>,
  abbreviation: string
): string {
  const modpackEntries: Record<string, string> = {};
  const otherGroups: Array<[string, Record<string, string>]> = [];
  const rewardGroups: Record<string, string>[] = [];

  // Separar entradas do modpack e agrupar outras
  for (const [filePath, mappings] of allMapeamentos) {
    const filteredMappings: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(mappings)) {
      // Filtrar valores null, undefined ou vazios
      if (!value || value.trim() === '') continue;
      
      if (key.startsWith(`${abbreviation}.modpack.`)) {
        modpackEntries[key] = value;
      } else {
        filteredMappings[key] = value;
      }
    }

    if (Object.keys(filteredMappings).length > 0) {
      if (filePath.includes('reward_tables')) {
        rewardGroups.push(filteredMappings);
      } else {
        otherGroups.push([filePath, filteredMappings]);
      }
    }
  }

  // Construir JSON com formatação organizada
  const jsonLines: string[] = ['{'];
  let lastComma = false;

  // Adicionar entradas do modpack primeiro
  if (Object.keys(modpackEntries).length > 0) {
    const items = Object.entries(modpackEntries);
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      let line = `  "${key}": ${JSON.stringify(value)}`;
      if (i < items.length - 1 || otherGroups.length > 0 || rewardGroups.length > 0) {
        line += ',';
        lastComma = true;
      } else {
        lastComma = false;
      }
      jsonLines.push(line);
    }
  }

  // Adicionar outros grupos
  let prevGroup: string | null = null;
  for (let groupIdx = 0; groupIdx < otherGroups.length; groupIdx++) {
    const [filePath, mappings] = otherGroups[groupIdx];
    
    if (prevGroup && prevGroup !== filePath) {
      if (lastComma) {
        jsonLines.push('');
      } else {
        jsonLines[jsonLines.length - 1] += ',';
        jsonLines.push('');
      }
    }

    const items = Object.entries(mappings);
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      let line = `  "${key}": ${JSON.stringify(value)}`;
      const needsComma = i < items.length - 1 || groupIdx < otherGroups.length - 1 || rewardGroups.length > 0;
      if (needsComma) {
        line += ',';
        lastComma = true;
      } else {
        lastComma = false;
      }
      jsonLines.push(line);
    }
    
    prevGroup = filePath;
  }

  // Adicionar grupos de reward
  if (rewardGroups.length > 0) {
    if (jsonLines[jsonLines.length - 1].endsWith(',')) {
      jsonLines.push('');
    } else if (otherGroups.length > 0 || Object.keys(modpackEntries).length > 0) {
      jsonLines[jsonLines.length - 1] += ',';
      jsonLines.push('');
    }

    const allRewards: Record<string, string> = {};
    for (const rewards of rewardGroups) {
      Object.assign(allRewards, rewards);
    }

    const items = Object.entries(allRewards);
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i];
      let line = `  "${key}": ${JSON.stringify(value)}`;
      if (i < items.length - 1) {
        line += ',';
      }
      jsonLines.push(line);
    }
  }

  jsonLines.push('}');
  return jsonLines.join('\n');
}

async function extractModpackName(zip: JSZip): Promise<string> {
  const mcmanifest = zip.file('manifest.json');
  if (mcmanifest) {
    const content = await mcmanifest.async('string');
    return JSON.parse(content).name;
  }
  return 'Modpack';
}

export async function processModpackZip(zipData: Uint8Array) {
  const logLines: string[] = [];
  const JSZip = (await import("jszip")).default;
  
  try {
    const zip = await JSZip.loadAsync(zipData);
    const modpackName = await extractModpackName(zip);
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
    : '';
  
  // Calcular subpath como no Python
  const pathParts = relativePath.split('/');
  const dirPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
  const subpath = dirPath || '.';
  const chapterFolder = subpath !== '.' ? subpath.split('/')[0] : null;
  
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
    
    // Detectar contextos
    if (stripped.startsWith('tasks: [')) {
      currentContext = 'tasks';
    } else if (stripped.startsWith('rewards: [')) {
      currentContext = 'rewards';
    } else if (stripped === ']') {
      currentContext = null;
    }
    
    // Contar profundidade de chaves/colchetes
    const openBraces = (line.match(/[{\[]/g) || []).length;
    const closeBraces = (line.match(/[}\]]/g) || []).length;
    braceDepth += openBraces - closeBraces;
    
    // Handle inline description arrays: description: ["text1", "text2"]
    if (/^\s*description:\s*\[.*\]\s*$/.test(line)) {
      const indent = line.match(/^(\s*)/)![1];
      const descriptions = line.match(/"((?:[^"\\]|\\.)*)"/g) || [];
      const novasLinhas = [indent + 'description: ['];
      
      descriptions.forEach(desc => {
        const value = desc.slice(1, -1); // Remove quotes
        if (!value || value.trim() === '') return; // Skip empty values
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
        if (!originalValue || originalValue.trim() === '') {
          descTempLines.push(line); // Keep empty descriptions as is
          continue;
        }
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
        if (!value || value.trim() === '') return match;
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
      
      if (!originalValue || originalValue.trim() === '') {
        modifiedLines.push(line);
        continue;
      }
      
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
        
        if (/\{ftbquests\./.test(originalValue) || !originalValue || originalValue.trim() === '') {
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

export async function processSnbtFiles(files: File[]) {
  const logLines: string[] = [];
  
  try {
    // Determinar nome base para abreviação
    let baseName = 'modpack';
    
    // Se há uma pasta comum, usar o nome da pasta
    if (files.length > 0) {
      const firstFile = files[0];
      if (firstFile.webkitRelativePath) {
        // Extrair nome da pasta principal
        const pathParts = firstFile.webkitRelativePath.split('/');
        if (pathParts.length > 1) {
          baseName = pathParts[0]; // Nome da pasta principal
        }
      } else {
        // Se não há pasta, usar nome do primeiro arquivo
        baseName = generateFileAbbreviation(firstFile.name.replace('.snbt', ''));
      }
    }
    
    const abbreviation = generateAbbreviation(baseName);
    logLines.push(`Processing files with abbreviation: ${abbreviation}`);
    
    const JSZip = (await import("jszip")).default;
    const outputZip = new JSZip();
    const allMapeamentos: Array<[string, Record<string, string>]> = [];
    
    for (const file of files) {
      logLines.push(`\n→ ${file.name}`);
      
      const content = await file.text();
      const relativePath = file.webkitRelativePath || file.name;
      
      const { modifiedContent, mappings } = processSnbtContent(
        content, 
        relativePath, 
        'config/ftbquests/quests', 
        abbreviation
      );
      
      outputZip.file(`output/config/ftbquests/quests/${file.name}`, modifiedContent);
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
