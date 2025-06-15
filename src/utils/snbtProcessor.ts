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
  // Parse manual para detectar capítulo/snbt basename
  const currentFilename = caminhoRel.split("/").pop() || "";
  const fileId = currentFilename.endsWith(".snbt") ? currentFilename.replace(/\.snbt$/, "") : null;
  const pathParts = caminhoRel.split("/");
  let subdir = "";
  if (caminhoRel.startsWith(questsDir)) {
    subdir = caminhoRel.slice(questsDir.length).replace(/^\//, "");
  }
  const chapterFolder = subdir ? subdir.split("/")[0] : "";

  // Mapeamentos
  const mapeamentos: Record<string, string> = {};
  const conteudoModificado: string[] = [];

  // Salva campo do capítulo, se houver
  const chapterId = fileId || "unknown";
  // Extrai campos fora de "quests: ["
  const chapterTitleMatch = conteudo.match(/^\s*title:\s*(.+)$/m);
  if (chapterTitleMatch) {
    mapeamentos[
      `${abbreviation}.quests.${chapterFolder}.snbt.${chapterId}.title`
    ] = decodeUnicode(chapterTitleMatch[1].replace(/^"/, "").replace(/"$/, ""));
  }
  const chapterSubtitleMatch = conteudo.match(/^\s*subtitle:\s*(.+)$/m);
  if (chapterSubtitleMatch) {
    mapeamentos[
      `${abbreviation}.quests.${chapterFolder}.snbt.${chapterId}.subtitle`
    ] = decodeUnicode(chapterSubtitleMatch[1].replace(/^"/, "").replace(/"$/, ""));
  }
  const chapterDescMatch = conteudo.match(/^\s*description:\s*\[\s*(".*?")\s*\]/ms);
  if (chapterDescMatch) {
    mapeamentos[
      `${abbreviation}.quests.${chapterFolder}.snbt.${chapterId}.desc`
    ] = decodeUnicode(chapterDescMatch[1].replace(/^"/, "").replace(/"$/, ""));
  }

  // Parse array principal de quests com regex "quests: [" ... "]"
  const questsArrMatch = conteudo.match(/quests:\s*\[([\s\S]*?)\]/m);
  if (questsArrMatch) {
    const questsArrContent = questsArrMatch[1];
    // Split on top-level objects (quest): detect lines that start with "{" at column 0
    const questBlocks = questsArrContent
      .split(/^\s*\{/m)
      .map((block, i) => (i === 0 ? block : "{" + block))
      .filter(b => b.trim().length > 10 && b.includes("title:")); // rudimentary filter

    for (const questBlock of questBlocks) {
      // Extrai o id da quest (obrigatório)
      const idMatch = questBlock.match(/^\s*id:\s*"([^"]+)"/m);
      const questId = idMatch?.[1] || "";

      // title
      const titleMatch = questBlock.match(/^\s*title:\s*"([^"]+)"/m);
      if (titleMatch && questId) {
        mapeamentos[
          `${abbreviation}.quests.${chapterFolder}.snbt.${chapterId}.quest.${questId}.title`
        ] = decodeUnicode(titleMatch[1]);
      }
      // subtitle
      const subtitleMatch = questBlock.match(/^\s*subtitle:\s*"([^"]+)"/m);
      if (subtitleMatch && questId) {
        mapeamentos[
          `${abbreviation}.quests.${chapterFolder}.snbt.${chapterId}.quest.${questId}.subtitle`
        ] = decodeUnicode(subtitleMatch[1]);
      }
      // description (lista: description: [ ... ])
      const descriptionArrMatch = questBlock.match(/description:\s*\[([\s\S]*?)\]/m);
      if (descriptionArrMatch && questId) {
        // extrai todas as linhas "   \"....\","
        const descLines = [];
        const descRegex = /"(.*?)"/g;
        let m;
        while ((m = descRegex.exec(descriptionArrMatch[1])) !== null) {
          if (m[1].trim() !== "")
            descLines.push(decodeUnicode(m[1]));
        }
        if (descLines.length) {
          mapeamentos[
            `${abbreviation}.quests.${chapterFolder}.snbt.${chapterId}.quest.${questId}.desc`
          ] = descLines.join("\\n");
        }
      }

      // --- TASKS ---
      // Busca por tasks: [ ... ]
      const tasksArrMatch = questBlock.match(/tasks:\s*\[([\s\S]*?)\]/m);
      if (tasksArrMatch) {
        // Regex de cada task: "{ ... }"
        const taskBlocks = tasksArrMatch[1]
          .split(/^\s*\{/m)
          .map((b, i) => (i === 0 ? b : "{" + b))
          .filter(b => b.trim().length > 2 && b.includes("id:"));
        for (const taskBlock of taskBlocks) {
          const taskIdMatch = taskBlock.match(/id:\s*"([^"]+)"/m);
          const taskId = taskIdMatch?.[1];
          const titleMatch = taskBlock.match(/^\s*title:\s*"([^"]+)"/m);
          if (titleMatch && taskId && questId) {
            mapeamentos[
              `${abbreviation}.quests.${chapterFolder}.snbt.${chapterId}.quest.${questId}.tasks.${taskId}.title`
            ] = decodeUnicode(titleMatch[1]);
          }
          // description em task
          const descMatch = taskBlock.match(/description:\s*\[([\s\S]*?)\]/m);
          if (descMatch && taskId && questId) {
            const descs = [];
            const descRegex = /"(.*?)"/g;
            let dm;
            while ((dm = descRegex.exec(descMatch[1])) !== null) {
              if (dm[1].trim() !== "")
                descs.push(decodeUnicode(dm[1]));
            }
            if (descs.length) {
              mapeamentos[
                `${abbreviation}.quests.${chapterFolder}.snbt.${chapterId}.quest.${questId}.tasks.${taskId}.desc`
              ] = descs.join("\\n");
            }
          }
        }
      }

      // --- REWARDS ---
      const rewardsArrMatch = questBlock.match(/rewards:\s*\[([\s\S]*?)\]/m);
      if (rewardsArrMatch) {
        // Regex de cada reward: "{ ... }"
        const rewardBlocks = rewardsArrMatch[1]
          .split(/^\s*\{/m)
          .map((b, i) => (i === 0 ? b : "{" + b))
          .filter(b => b.trim().length > 2 && b.includes("id:"));
        for (const rewardBlock of rewardBlocks) {
          const rewardIdMatch = rewardBlock.match(/id:\s*"([^"]+)"/m);
          const rewardId = rewardIdMatch?.[1];
          const titleMatch = rewardBlock.match(/^\s*title:\s*"([^"]+)"/m);
          if (titleMatch && rewardId && questId) {
            mapeamentos[
              `${abbreviation}.quests.${chapterFolder}.snbt.${chapterId}.quest.${questId}.rewards.${rewardId}.title`
            ] = decodeUnicode(titleMatch[1]);
          }
          // description em reward
          const descMatch = rewardBlock.match(/description:\s*\[([\s\S]*?)\]/m);
          if (descMatch && rewardId && questId) {
            const descs = [];
            const descRegex = /"(.*?)"/g;
            let dm;
            while ((dm = descRegex.exec(descMatch[1])) !== null) {
              if (dm[1].trim() !== "")
                descs.push(decodeUnicode(dm[1]));
            }
            if (descs.length) {
              mapeamentos[
                `${abbreviation}.quests.${chapterFolder}.snbt.${chapterId}.quest.${questId}.rewards.${rewardId}.desc`
              ] = descs.join("\\n");
            }
          }
        }
      }
    }
  }

  // Por enquanto mantenha o conteúdo modificado igual ao original
  return { conteudoModificado: conteudo, mapeamentos };
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
