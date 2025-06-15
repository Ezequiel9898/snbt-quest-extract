import JSZip from "jszip";

export type ProcessResult = {
  outputZip: JSZip;
  logLines: string[];
  jsonResult: string;
};

function generateAbbreviation(modpackName: string): string {
  // Igual Python
  const words = modpackName.trim().split(/[\W_]+/);
  if (!words.length) return "modpack";
  const abbrev = words.slice(0, -1).map(word => word ? word[0].toLowerCase() : "");
  const lastWord = words[words.length - 1];
  abbrev.push(/\d+/.test(lastWord) ? lastWord : lastWord[0].toLowerCase());
  return (abbrev.join("") || "modpack");
}

// Remove BOM e ignora erros encoding (browser sempre utf-8)
function decodeContent(arr: Uint8Array): string {
  return new TextDecoder("utf-8").decode(arr);
}

/** Funções core baseadas no script Python */
export async function processModpackZip(zipData: Uint8Array): Promise<ProcessResult> {
  const logLines: string[] = [];
  const zip = await JSZip.loadAsync(zipData);
  // Achar pasta do modpack raiz
  const folders = Object.keys(zip.files)
    .map(path => path.split("/")[0])
    .filter((v, i, arr) => arr.indexOf(v) === i && v.length > 0);
  const modpackFolder = folders.length === 1 ? folders[0] : "";
  const abbreviation = generateAbbreviation(modpackFolder || "modpack");
  logLines.push(`Modpack: ${modpackFolder || "modpack"} (${abbreviation})`);
  // Descobrir onde está "config/ftbquests/quests"
  let questsDir = "";
  for (const fname of Object.keys(zip.files)) {
    if (
      fname.endsWith("/") &&
      fname.includes("config/ftbquests/quests")
    ) {
      questsDir = fname.slice(0, -1);
      break;
    }
  }
  if (!questsDir) {
    // fallback: encontrar arquivo snbt que contenha o path
    for (const fname of Object.keys(zip.files)) {
      if (fname.includes("config/ftbquests/quests")) {
        const dirPath = fname.split("config/ftbquests/quests")[0] + "config/ftbquests/quests";
        if (Object.keys(zip.files).find(f => f.startsWith(dirPath))) {
          questsDir = dirPath;
          break;
        }
      }
    }
  }
  if (!questsDir) {
    logLines.push("Não foi possível encontrar a pasta de quests no ZIP (config/ftbquests/quests).");
    throw new Error("Não foi possível encontrar config/ftbquests/quests no ZIP.");
  }

  // Limpar output do ZIP se existir, criar estrutura output/
  const outputZip = new JSZip();
  const allMapeamentos: [string, Record<string, string>][] = [];

  // Selecionar apenas .snbt dentro de questsDir (e subpastas, exceto output)
  const snbtFiles = Object.keys(zip.files)
    .filter(f => f.endsWith(".snbt") && f.startsWith(questsDir) && !f.includes("/output/"));

  for (const caminhoArquivo of snbtFiles) {
    const caminhoRel = caminhoArquivo;
    logLines.push(`→ ${caminhoRel}`);
    const conteudo = await zip.files[caminhoArquivo].async("uint8array").then(decodeContent);
    const res = processarConteudo(conteudo, caminhoRel, questsDir, abbreviation);
    const destino = `output/${caminhoRel}`;
    outputZip.file(destino, res.conteudoModificado);
    logLines.push("  ✓ OK");
    allMapeamentos.push([caminhoRel, res.mapeamentos]);
  }

  // Salvar mapeamentos no output
  let jsonResult = "";
  if (allMapeamentos.length > 0) {
    jsonResult = salvarMapeamentos(allMapeamentos, abbreviation, outputZip);
    logLines.push("✓ Traduções extraídas para: en_us.json");
  } else {
    logLines.push("! Nenhum texto traduzível encontrado");
  }

  return { outputZip, logLines, jsonResult };
}

// Adaptação do processar_conteudo
function processarConteudo(
  conteudo: string,
  caminhoRel: string,
  questsDir: string,
  abbreviation: string
) {
  const linhas = conteudo.split(/\r?\n/);
  const conteudoModificado: string[] = [];
  const mapeamentos: Record<string, string> = {};

  const currentFilename = caminhoRel.split("/").pop() || "";
  const fileId = currentFilename.endsWith(".snbt") ? currentFilename.replace(/\.snbt$/, "") : null;
  const pathParts = caminhoRel.split("/");
  // calcula subpath relativo a questsDir
  let subdir = "";
  if (caminhoRel.startsWith(questsDir)) {
    subdir = caminhoRel.slice(questsDir.length).replace(/^\//, "");
  }
  const chapterFolder = subdir ? subdir.split("/")[0] : "";

  let braceDepth = 0;
  let questTitleCounter = 1;
  let questSubtitleCounter = 1;
  let questDescCounter = 1;
  let rewardTitleCounter = 1;
  let taskTitleCounter = 1;
  let chapterGroupTitleCounter = 1;
  let dentroDeDescription = false;
  let descLinhasTemp: string[] = [];
  let contextoAtual: "tasks" | "rewards" | null = null;
  let currentTaskOrRewardId: string | null = null;
  let insideTaskOrReward: boolean = false;

  for (let i = 0; i < linhas.length; ++i) {
    const linha = linhas[i];
    const stripped = linha.trim();

    // Detecta contexto de tasks/rewards
    if (stripped.startsWith("tasks: [")) {
      contextoAtual = "tasks";
      insideTaskOrReward = false;
      currentTaskOrRewardId = null;
    } else if (stripped.startsWith("rewards: [")) {
      contextoAtual = "rewards";
      insideTaskOrReward = false;
      currentTaskOrRewardId = null;
    } else if (stripped === "]") {
      contextoAtual = null;
      insideTaskOrReward = false;
      currentTaskOrRewardId = null;
    }

    // Detecta início/fim de objeto task/reward (baseado em { })
    if (contextoAtual && stripped === "{") {
      insideTaskOrReward = true;
      currentTaskOrRewardId = null;
      conteudoModificado.push(linha);
      continue;
    }
    if (contextoAtual && stripped === "},") {
      insideTaskOrReward = false;
      currentTaskOrRewardId = null;
      conteudoModificado.push(linha);
      continue;
    }
    // Detecta id da task/reward
    if (insideTaskOrReward && stripped.startsWith("id:")) {
      // Exemplo: id: "xxxxx"
      const matchTaskId = stripped.match(/^id:\s*"([^"]+)"/);
      if (matchTaskId) {
        currentTaskOrRewardId = matchTaskId[1];
      }
      conteudoModificado.push(linha);
      continue;
    }

    // description: [ ... ] inline
    const descInlineMatch = linha.match(/^\s*description:\s*\[(.*?)\]\s*$/);
    if (descInlineMatch) {
      const indent = linha.match(/^(\s*)/)![1];
      const descricao = [];
      const regex = /"((?:[^"\\]|\\.)*)"/g;
      let matchQ;
      while ((matchQ = regex.exec(descInlineMatch[1])) !== null) {
        descricao.push(matchQ[1]);
      }
      const novasLinhas = [`${indent}description: [`];
      for (const valor of descricao) {
        let chave;
        if (contextoAtual && insideTaskOrReward && currentTaskOrRewardId) {
          chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.${contextoAtual}.${currentTaskOrRewardId}.desc`;
        } else {
          chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.desc${questDescCounter}`;
          questDescCounter += 1;
        }
        mapeamentos[chave] = decodeUnicode(valor);
        console.log(`[DEBUG] Mapping (descInline)`, chave, '=>', mapeamentos[chave]);
        novasLinhas.push(`${indent}  "{${chave}}"`);
      }
      novasLinhas.push(`${indent}]`);
      conteudoModificado.push(...novasLinhas);
      continue;
    }

    // description block
    if (linha.includes("description: [")) {
      dentroDeDescription = true;
      descLinhasTemp = [];
      conteudoModificado.push(linha);
      continue;
    }
    if (dentroDeDescription) {
      if (linha.includes("]")) {
        dentroDeDescription = false;
        conteudoModificado.push(...descLinhasTemp);
        conteudoModificado.push(linha);
        continue;
      }
      const matchDesc = linha.match(/^(\s*)"((?:[^"\\\\]|\\\\.)*)"\s*$/);
      if (matchDesc) {
        const indent = matchDesc[1];
        const valorOriginal = matchDesc[2];
        let chave;
        if (contextoAtual && insideTaskOrReward && currentTaskOrRewardId) {
          chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.${contextoAtual}.${currentTaskOrRewardId}.desc`;
        } else {
          chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.desc${questDescCounter}`;
          questDescCounter += 1;
        }
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        console.log(`[DEBUG] Mapping (descBlock)`, chave, '=>', mapeamentos[chave]);
        descLinhasTemp.push(`${indent}"{${chave}}"`);
        continue;
      }
      descLinhasTemp.push(linha);
      continue;
    }

    // titles / subtitles: quest, task, reward
    let handled = false;
    for (const tipo of ["title", "subtitle"]) {
      const matchX = linha.match(new RegExp(`^(\\s*)${tipo}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
      if (matchX) {
        const indent = matchX[1];
        const valor = matchX[2];
        if (/\{ftbquests\./.test(valor)) break; // ignora já mapeadas
        let chave = "";
        if (contextoAtual && insideTaskOrReward && currentTaskOrRewardId) {
          // Título de task ou reward
          chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.${contextoAtual}.${currentTaskOrRewardId}.${tipo}`;
        } else if (currentFilename === "data.snbt") {
          chave = `${abbreviation}.modpack.${tipo}`;
        } else if (chapterFolder && fileId && braceDepth <= 2) {
          chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.${tipo}`;
        } else if (chapterFolder && fileId && braceDepth > 2) {
          const contador = tipo === "title" ? questTitleCounter : questSubtitleCounter;
          chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.${tipo}${contador}`;
          if (tipo === "title") questTitleCounter += 1;
          else questSubtitleCounter += 1;
        } else break;
        mapeamentos[chave] = decodeUnicode(valor);
        console.log(`[DEBUG] Mapping (${tipo})`, chave, '=>', mapeamentos[chave]);
        conteudoModificado.push(`${indent}${tipo}: "{${chave}}"`);
        handled = true;
        break;
      }
    }
    if (handled) continue;

    // chapter_groups.snbt tratamento especial
    if (currentFilename === "chapter_groups.snbt") {
      const novaLinha = linha.replace(/title:\s*"((?:[^"\\]|\\.)*)"/g, (_match, val) => {
        const chave = `${abbreviation}.chapter_groups.title${chapterGroupTitleCounter++}`;
        mapeamentos[chave] = decodeUnicode(val);
        console.log(`[DEBUG] Mapping (chapter_groups)`, chave, '=>', mapeamentos[chave]);
        return `title: "{${chave}}"`;
      });
      conteudoModificado.push(novaLinha);
      continue;
    }

    conteudoModificado.push(linha);
  }
  console.log(`[DEBUG] Mapping count for ${caminhoRel}:`, Object.keys(mapeamentos).length);
  return { conteudoModificado: conteudoModificado.join("\n"), mapeamentos };
}

// Substituir apenas esta função:
function salvarMapeamentos(
  allMapeamentos: [string, Record<string, string>][],
  abbreviation: string,
  outputZip: JSZip
): string {
  const caminhoJson = `output/en_us.json`;
  const finalJson: Record<string, string> = {};

  // Função para padronizar chave por quest
  function parseKey(key: string) {
    // Exemplo: c.quests.the_nether.snbt.46D0AAEEB69E28B3.title
    // regex: prefix.quests.chapter.snbt.fileId.field[.idx]
    const questMatch = key.match(/^([^.]+)\.quests\.([^.]+)\.snbt\.([^.]+)\.([^.]+)\.?(\d*)$/);
    if (!questMatch) return null;
    // c, the_nether, 46D0AAEEB69E28B3, campo (title...), idx
    return {
      prefix: questMatch[1],
      chapter: questMatch[2],
      fileId: questMatch[3],
      field: questMatch[4],
      idx: questMatch[5] || ""
    };
  }

  // Agrupa por quest id
  const questsGrouped: Record<string, Record<string, string>> = {};
  const extraKeys: Record<string, string> = {}; // chaves fora do padrão quest

  for (const [filePath, mappings] of allMapeamentos) {
    for (const key of Object.keys(mappings)) {
      const parsed = parseKey(key);
      if (!parsed) {
        // Inclui chave "extra" sem agrupar
        extraKeys[key] = mappings[key];
        continue;
      }
      // Chave identificadora única para cada quest
      const questKey = `${parsed.prefix}.quests.${parsed.chapter}.snbt.${parsed.fileId}`;
      if (!questsGrouped[questKey]) questsGrouped[questKey] = {};
      let fieldName = parsed.field;
      // Normaliza nomes de campo para ordem
      if (fieldName.startsWith("desc")) fieldName = "desc" + (parsed.idx || "");
      if (fieldName.startsWith("task")) fieldName = "task" + (parsed.idx || "");
      if (fieldName.startsWith("reward")) fieldName = "reward" + (parsed.idx || "");
      questsGrouped[questKey][fieldName] = mappings[key];
    }
  }

  // Ordena as chaves internas conforme especificação do usuário
  const fieldOrder = [
    "title",
    "subtitle",
    "desc1", "desc2", "desc3", "desc4", "desc5",
    "task1", "task2", "task3", "task4", "task5",
    "reward1", "reward2", "reward3", "reward4", "reward5"
  ];

  // Monta o JSON final agrupado e ordenado por quest
  for (const questKey of Object.keys(questsGrouped)) {
    const fields = questsGrouped[questKey];
    // Garante ordem desejada
    const orderedFields = Object.keys(fields).sort((a, b) => {
      const ia = fieldOrder.indexOf(a);
      const ib = fieldOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    for (const field of orderedFields) {
      const fullKey = `${questKey}.${field}`;
      finalJson[fullKey] = fields[field];
    }
  }

  // Adiciona as chaves extras (como chapter_groups, data geral do modpack, etc)
  for (const key in extraKeys) {
    finalJson[key] = extraKeys[key];
  }

  // LOG total de mapeamentos para cada arquivo
  for(const [filePath, mappings] of allMapeamentos) {
    console.log(`[DEBUG] Mappings from file ${filePath}:`, Object.keys(mappings).length, Object.keys(mappings));
  }

  const jsonLines = JSON.stringify(finalJson, null, 2) + "\n";
  console.log(`[DEBUG] Chaves finais no JSON:`, Object.keys(finalJson).length, Object.keys(finalJson));
  outputZip.file(caminhoJson, jsonLines);
  return jsonLines;
}

// python: valor.encode('latin-1',errors='backslashreplace').decode('unicode_escape')
function decodeUnicode(valor: string): string {
  // No browser: só escapamos unicode \uXXXX e trad. comum
  try {
    return valor.replace(/\\u([\dA-Fa-f]{4})/g, (_m, code) => String.fromCharCode(parseInt(code,16)));
  } catch {
    return valor;
  }
}
