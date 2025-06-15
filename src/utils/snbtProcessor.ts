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
    // ATUALIZAÇÃO: processa linha-a-linha como no Python!
    const { conteudoModificado, mapeamentos } = processarConteudoLinhaPorLinha(
      conteudo,
      caminhoRel,
      questsDir,
      abbreviation
    );
    const destino = `output/${caminhoRel}`;
    outputZip.file(destino, conteudoModificado);
    logLines.push("  ✓ OK");
    allMapeamentos.push([caminhoRel, mapeamentos]);
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

// ADAPTADO: processarConteudo linha a linha tipo Python
function processarConteudoLinhaPorLinha(
  conteudo: string,
  caminhoRel: string,
  questsDir: string,
  abbreviation: string
) {
  const linhas = conteudo.split(/\r?\n/);
  const conteudoModificado: string[] = [];
  const mapeamentos: Record<string, string> = {};

  // Parse manual para detectar capítulo/snbt basename
  const currentFilename = caminhoRel.split("/").pop() || "";
  const fileId = currentFilename.endsWith(".snbt") ? currentFilename.replace(/\.snbt$/, "") : null;
  const pathParts = caminhoRel.split("/");
  let subdir = "";
  if (caminhoRel.startsWith(questsDir)) {
    subdir = caminhoRel.slice(questsDir.length).replace(/^\//, "");
  }
  const chapterFolder = subdir ? subdir.split("/")[0] : fileId;

  let contextoAtual: "tasks" | "rewards" | "quests" | null = null;
  let braceDepth = 0;
  let questTitleCounter = 1, questSubtitleCounter = 1, questDescCounter = 1;
  let rewardTitleCounter = 1, taskTitleCounter = 1, rewardDescCounter = 1, taskDescCounter = 1;
  let dentroDeDescription = false;
  let descBuffer: string[] = [];
  let inQuestArray = false;

  function makeKey(tipo: string, idx: number) {
    return `${abbreviation}.quests.${chapterFolder}.snbt.${fileId}.${tipo}${idx > 1 ? idx : ""}`;
  }
  function makeSectionKey(tipo: string, sec: string, id: string | undefined, idx: number) {
    // tipo: 'task'|'reward', sec: 'tasks'|'rewards'
    if (id)
      return `${abbreviation}.quests.${chapterFolder}.snbt.${fileId}.${sec}.${id}.${tipo}`;
    // fallback: numerado
    return `${abbreviation}.quests.${chapterFolder}.snbt.${fileId}.${sec}.${tipo}${idx > 1 ? idx : ""}`;
  }

  let lastSectionId: string | undefined = undefined;
  let lastType: "task"|"reward"|undefined = undefined;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const stripped = linha.trim();

    // Atualiza contexto
    if (/^quests:\s*\[/.test(stripped)) {
      contextoAtual = "quests";
      inQuestArray = true;
      // zera contadores para cada quest array (mas geralmente só há um por arquivo)
      questTitleCounter = 1; questSubtitleCounter = 1; questDescCounter = 1;
    }
    if (/^tasks:\s*\[/.test(stripped)) {
      contextoAtual = "tasks";
      lastType = "task";
      // reinicia contadores para tasks
      taskTitleCounter = 1; taskDescCounter = 1;
    }
    if (/^rewards:\s*\[/.test(stripped)) {
      contextoAtual = "rewards";
      lastType = "reward";
      rewardTitleCounter = 1; rewardDescCounter = 1;
    }
    // Checa fim de contexto
    if (stripped === "]") {
      if (contextoAtual === "tasks") contextoAtual = null;
      else if (contextoAtual === "rewards") contextoAtual = null;
      else if (contextoAtual === "quests") { contextoAtual = null; inQuestArray = false; }
      lastSectionId = undefined;
      lastType = undefined;
    }

    // Atualiza profundidade 
    braceDepth += (linha.match(/[\[\{]/g) || []).length;
    braceDepth -= (linha.match(/[\]\}]/g) || []).length;

    // MULTILINE descriptions: description: [
    if (/^\s*description:\s*\[$/.test(linha)) {
      dentroDeDescription = true;
      descBuffer = [];
      conteudoModificado.push(linha); // mantém o início da descrição
      continue;
    }
    if (dentroDeDescription) {
      // Fim da descrição
      if (/^\s*\]/.test(stripped)) {
        dentroDeDescription = false;
        conteudoModificado.push(...descBuffer);
        conteudoModificado.push(linha);
        descBuffer = [];
        continue;
      }
      // Processa cada linha de descrição
      const mDesc = linha.match(/^(\s*)"(.*)"\s*,?$/);
      if (mDesc) {
        const indent = mDesc[1];
        const valorOriginal = mDesc[2];
        let chave = "";
        if (contextoAtual === "tasks" && lastSectionId) {
          chave = makeSectionKey("desc", "tasks", lastSectionId, taskDescCounter);
          mapeamentos[chave] = decodeUnicode(valorOriginal);
          descBuffer.push(`${indent}"{${chave}}"`);
          taskDescCounter++;
        } else if (contextoAtual === "rewards" && lastSectionId) {
          chave = makeSectionKey("desc", "rewards", lastSectionId, rewardDescCounter);
          mapeamentos[chave] = decodeUnicode(valorOriginal);
          descBuffer.push(`${indent}"{${chave}}"`);
          rewardDescCounter++;
        } else if (contextoAtual === "quests" || contextoAtual === null) {
          chave = makeKey("desc", questDescCounter);
          mapeamentos[chave] = decodeUnicode(valorOriginal);
          descBuffer.push(`${indent}"{${chave}}"`);
          questDescCounter++;
        }
        continue;
      }
      descBuffer.push(linha); // fallback, mantém linha
      continue;
    }

    // Identifica id da seção atual dentro de tasks/rewards para usar nos campos
    // Ex: id: "51F29EA99BAE4EDA"
    if ((contextoAtual === "tasks" || contextoAtual === "rewards") && /id:\s*"([^"]+)"/.test(stripped)) {
      const m = stripped.match(/id:\s*"([^"]+)"/);
      if (m) lastSectionId = m[1];
    }

    // Substituição inline de 'title: "..."'
    const mTitle = linha.match(/^(\s*)title:\s*"((?:[^"\\]|\\.)*)"\s*,?$/);
    if (mTitle) {
      const indent = mTitle[1];
      const valorOriginal = mTitle[2];
      let chave = "";
      if (contextoAtual === "tasks" && lastSectionId) {
        chave = makeSectionKey("title", "tasks", lastSectionId, taskTitleCounter);
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        conteudoModificado.push(`${indent}title: "{${chave}}"`);
        taskTitleCounter++;
        continue;
      } else if (contextoAtual === "rewards" && lastSectionId) {
        chave = makeSectionKey("title", "rewards", lastSectionId, rewardTitleCounter);
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        conteudoModificado.push(`${indent}title: "{${chave}}"`);
        rewardTitleCounter++;
        continue;
      } else if (inQuestArray) {
        chave = makeKey("title", questTitleCounter);
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        conteudoModificado.push(`${indent}title: "{${chave}}"`);
        questTitleCounter++;
        continue;
      } else { // cap de capítulo, arquivo etc
        chave = makeKey("title", 1);
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        conteudoModificado.push(`${indent}title: "{${chave}}"`);
        continue;
      }
    }

    // Substituição inline de 'subtitle: "..."'
    const mSubtitle = linha.match(/^(\s*)subtitle:\s*"((?:[^"\\]|\\.)*)"\s*,?$/);
    if (mSubtitle) {
      const indent = mSubtitle[1];
      const valorOriginal = mSubtitle[2];
      let chave = "";
      if (inQuestArray) {
        chave = makeKey("subtitle", questSubtitleCounter);
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        conteudoModificado.push(`${indent}subtitle: "{${chave}}"`);
        questSubtitleCounter++;
        continue;
      } else {
        chave = makeKey("subtitle", 1);
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        conteudoModificado.push(`${indent}subtitle: "{${chave}}"`);
        continue;
      }
    }

    // Substituição inline para descrições de linha única: description: ["..."]
    const mDescOneLine = linha.match(/^(\s*)description:\s*\[\s*"((?:[^"\\]|\\.)*)"\s*\]\s*$/);
    if (mDescOneLine) {
      const indent = mDescOneLine[1];
      const valorOriginal = mDescOneLine[2];
      let chave = "";
      if (contextoAtual === "tasks" && lastSectionId) {
        chave = makeSectionKey("desc", "tasks", lastSectionId, 1);
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        conteudoModificado.push(`${indent}description: ["{${chave}}"]`);
        continue;
      } else if (contextoAtual === "rewards" && lastSectionId) {
        chave = makeSectionKey("desc", "rewards", lastSectionId, 1);
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        conteudoModificado.push(`${indent}description: ["{${chave}}"]`);
        continue;
      } else {
        chave = makeKey("desc", questDescCounter);
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        conteudoModificado.push(`${indent}description: ["{${chave}}"]`);
        questDescCounter++;
        continue;
      }
    }

    // Fallback: mantém linha
    conteudoModificado.push(linha);
  }

  return {
    conteudoModificado: conteudoModificado.join("\n"),
    mapeamentos,
  };
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

  // Agrupa por quest id na ordem de mapeamento original
  const questsGrouped: Record<string, Record<string, string>> = {};
  const questOrder: string[] = [];
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
      if (!questsGrouped[questKey]) {
        questsGrouped[questKey] = {};
        questOrder.push(questKey);
      }
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

  // Monta o JSON final agrupado e ordenado por quest na ordem de aparição
  for (const questKey of questOrder) {
    const fields = questsGrouped[questKey];
    // Garante ordem desejada dos campos
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
