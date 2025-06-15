import JSZip from "jszip";

export type ProcessResult = {
  outputZip: JSZip;
  logLines: string[];
  jsonResult: string;
};

// Nova lógica para abreviação igualzinho ao Python
function generateAbbreviation(modpackName: string): string {
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
    // Substitui por lógica do Python
    const { conteudoModificado, mapeamentos } = processarConteudoComoPython(
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

// ALGORITMO NOVO — fiel ao código Python do usuário!
function processarConteudoComoPython(
  conteudo: string,
  caminhoRel: string,
  questsDir: string,
  abbreviation: string
) {
  const linhas = conteudo.split(/\r?\n/);
  const conteudoModificado: string[] = [];
  const mapeamentos: Record<string, string> = {};

  const currentFilename = caminhoRel.split("/").pop() || "";
  const fileId = currentFilename.endsWith(".snbt") ? currentFilename.replace(/\.snbt$/, "") : undefined;

  // Subdiretório tipo chapter_folder igual ao Python
  let subpath = "";
  if (caminhoRel.startsWith(questsDir)) {
    subpath = caminhoRel.slice(questsDir.length).replace(/^\//, "");
  }
  const chapterFolder = subpath
    ? subpath.split("/")[0]
    : null;

  let braceDepth = 0;
  let questTitleCounter = 1;
  let questSubtitleCounter = 1;
  let questDescCounter = 1;
  let rewardTitleCounter = 1;
  let taskTitleCounter = 1;
  let chapterGroupTitleCounter = 1;
  let dentroDeDescription = false;
  let descLinhasTemp: string[] = [];
  let contextoAtual: string | null = null;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const stripped = linha.trim();

    if (/^tasks:\s*\[/.test(stripped)) contextoAtual = "tasks";
    else if (/^rewards:\s*\[/.test(stripped)) contextoAtual = "rewards";
    else if (stripped === "]") contextoAtual = null;

    // Open/close braces
    const openBraces = (linha.match(/\{/g) || []).length + (linha.match(/\[/g) || []).length;
    const closeBraces = (linha.match(/\}/g) || []).length + (linha.match(/\]/g) || []).length;
    braceDepth += openBraces - closeBraces;

    // description: [ ... ] inline (uma linha só)
    const mDescInline = linha.match(/^\s*description:\s*\[(.*)\]\s*$/);
    if (mDescInline) {
      const indent = linha.match(/^(\s*)/)[1];
      const descricoes = [...mDescInline[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(m => m[1]);
      const novasLinhas = [`${indent}description: [`];
      for (const valor of descricoes) {
        const chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.desc${questDescCounter}`;
        mapeamentos[chave] = decodeUnicode(valor);
        novasLinhas.push(`${indent}  "{${chave}}"`);
        questDescCounter += 1;
      }
      novasLinhas.push(`${indent}]`);
      conteudoModificado.push(...novasLinas);
      continue;
    }

    if (linha.includes("description: [") && !/^\s*description:\s*\[.*\]\s*$/.test(linha)) {
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

      const matchDesc = linha.match(/^(\s*)"(.*)"\s*$/);
      if (matchDesc) {
        const indent = matchDesc[1];
        const valorOriginal = matchDesc[2];
        const chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.desc${questDescCounter}`;
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        descLinhasTemp.push(`${indent}"{${chave}}"`);
        questDescCounter += 1;
        continue;
      }
    }

    // Special: chapter_groups.snbt — título
    if (currentFilename === "chapter_groups.snbt") {
      let replaced = false;
      const novaLinha = linha.replace(/title:\s*"((?:[^"\\]|\\.)*)"/g, (_m, valorOriginal) => {
        const chave = `${abbreviation}.chapter_groups.title${chapterGroupTitleCounter}`;
        chapterGroupTitleCounter += 1;
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        replaced = true;
        return `title: "{${chave}}"`;
      });
      conteudoModificado.push(novaLinha);
      if (replaced) continue;
    }

    // title em tasks/rewards ou geral
    const matchTitle = linha.match(/^(\s*)title:\s*"((?:[^"\\]|\\.)*)"\s*$/);
    if (matchTitle) {
      const indent = matchTitle[1];
      const valorOriginal = matchTitle[2];
      const valorDecodificado = decodeUnicode(valorOriginal);

      if (contextoAtual === "rewards") {
        const chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.reward${rewardTitleCounter}`;
        rewardTitleCounter += 1;
        mapeamentos[chave] = valorDecodificado;
        conteudoModificado.push(`${indent}title: "{${chave}}"`);
        continue;
      } else if (contextoAtual === "tasks") {
        const chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.task${taskTitleCounter}`;
        taskTitleCounter += 1;
        mapeamentos[chave] = valorDecodificado;
        conteudoModificado.push(`${indent}title: "{${chave}}"`);
        continue;
      }
    }

    // Cobre também title, subtitle especialmente, mas só se não for title tratado acima e não contexto especial
    let modified = false;
    for (const tipo of ["title", "subtitle"]) {
      const match = linha.match(new RegExp(`^(\\s*)${tipo}:\\s*"((?:[^"\\\\]|\\\\.)*)"\\s*$`));
      if (match) {
        const indent = match[1];
        const valorOriginal = match[2];
        if (/\{ftbquests\./.test(valorOriginal)) break; // ignora se já é uma chave

        // Exatamente igual o Python para data.snbt/chapter_folder, etc
        let chave: string;
        if (currentFilename === "data.snbt") {
          chave = `${abbreviation}.modpack.${tipo}`;
        } else if (chapterFolder && fileId && braceDepth <= 2) {
          chave = `${abbreviation}.${chapterFolder}.${fileId}.${tipo}`;
        } else if (chapterFolder && fileId && braceDepth > 2) {
          const contador = tipo === "title" ? questTitleCounter : questSubtitleCounter;
          chave = `${abbreviation}.quests.${chapterFolder}.${fileId}.${tipo}${contador}`;
          if (tipo === "title") questTitleCounter += 1;
          else questSubtitleCounter += 1;
        } else {
          break; // não cobre
        }
        mapeamentos[chave] = decodeUnicode(valorOriginal);
        conteudoModificado.push(`${indent}${tipo}: "{${chave}}"`);
        modified = true;
        break;
      }
    }
    if (modified) continue;

    // Copia linhas que não estão nas regras acima
    if (!dentroDeDescription) conteudoModificado.push(linha);
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
      // Normaliza nomes de campo
      if (fieldName.startsWith("desc")) fieldName = "desc" + (parsed.idx || "");
      if (fieldName.startsWith("task")) fieldName = "task" + (parsed.idx || "");
      if (fieldName.startsWith("reward")) fieldName = "reward" + (parsed.idx || "");
      questsGrouped[questKey][fieldName] = mappings[key];
    }
  }

  // Nova lógica: ordenação manual dos campos por quest
  function questFieldsOrdered(fields: Record<string, string>): string[] {
    // Extrai todas as keys relevantes e separa nas listas para garantir a ordem exata desejada
    const titles: string[] = [];
    const subtitles: string[] = [];
    const descs: string[] = [];
    const tasks: string[] = [];
    const rewards: string[] = [];
    const extras: string[] = [];

    for (const field of Object.keys(fields)) {
      if (field === "title" || field.startsWith("title")) titles.push(field);
      else if (field === "subtitle" || field.startsWith("subtitle")) subtitles.push(field);
      else if (field.startsWith("desc")) descs.push(field);
      else if (field.startsWith("task")) tasks.push(field);
      else if (field.startsWith("reward")) rewards.push(field);
      else extras.push(field);
    }

    // Ordena numericamente listas com índice no sufixo
    const numericSort = (a: string, b: string) => {
      // extrai número ao final da string; se não houver, trata como 1
      const na = Number((a.match(/\d+$/)?.[0]) || 1);
      const nb = Number((b.match(/\d+$/)?.[0]) || 1);
      return na - nb;
    };

    titles.sort(numericSort);
    subtitles.sort(numericSort);
    descs.sort(numericSort);
    tasks.sort(numericSort);
    rewards.sort(numericSort);
    extras.sort(); // ordem alfabética para extras

    return [
      ...titles,
      ...subtitles,
      ...descs,
      ...tasks,
      ...rewards,
      ...extras,
    ];
  }

  // Monta o JSON final agrupado e ordenado por quest na ordem de aparição
  for (const questKey of questOrder) {
    const fields = questsGrouped[questKey];
    const orderedFields = questFieldsOrdered(fields);
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
