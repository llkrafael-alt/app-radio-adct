
export interface Hymn {
  number: number;
  title: string;
  lyrics: string;
}

const HARPA_CACHE_KEY = 'harpa_crista_offline_cache_v2';
// Link fornecido pelo usuário
const HARPA_URL = 'https://raw.githubusercontent.com/DanielLiberato/Harpa-Crista-JSON-640-Hinos-Completa/refs/heads/main/harpa_crista_640_hinos.json';

// Hinos de backup para caso de falha total na primeira vez sem internet
const FALLBACK_HYMNS: Hymn[] = [
  { number: 1, title: "Chuvas de Graça", lyrics: "Deus prometeu com certeza\nChuvas de graça mandar;\nEle nos dá fortaleza,\nE ricas bênçãos sem par.\n\n[Refrão]\nChuvas de graça,\nChuvas pedimos, Senhor;\nManda-nos chuvas constantes,\nChuvas do Consolador." },
  { number: 39, title: "Alvo Mais Que a Neve", lyrics: "Bendito seja o Cordeiro,\nQue na cruz por nós padeceu!\nBendito seja o Seu sangue,\nQue por nós, ali Ele verteu!\n\n[Refrão]\nAlvo mais que a neve!\nAlvo mais que a neve!\nSim, nesse sangue lavado,\nMais alvo que a neve serei." },
  { number: 126, title: "Bem-Aventurança", lyrics: "Bem-aventurado o que confia\nNo Senhor, como fez Abraão;\nEle creu, ainda que não via,\nE, assim, a fé não foi em vão." }
];

export const getHarpaHymns = async (): Promise<Hymn[]> => {
  // 1. Tenta carregar do Cache Local (Offline)
  try {
    const cached = localStorage.getItem(HARPA_CACHE_KEY);
    if (cached) {
      console.log("[Harpa] Carregando do cache offline.");
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn("[Harpa] Erro ao ler cache:", e);
  }

  // 2. Se não tem cache, baixa da internet
  console.log("[Harpa] Baixando hinos da internet...");
  
  try {
    const response = await fetch(HARPA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const processedHymns: Hymn[] = [];

    // Processa o formato específico desse JSON (Objeto com chaves "1", "2", etc.)
    // Remove chaves de metadados como "-1" se houver
    const keys = Object.keys(data).filter(k => !isNaN(Number(k)) && Number(k) > 0);

    for (const key of keys) {
        const item = data[key];
        
        // Título
        let title = item.hino || `Hino ${key}`;
        // Remove o número do título se vier repetido (ex: "1 - Título")
        if (title.includes(" - ")) {
            title = title.split(" - ").slice(1).join(" - ");
        }

        // Limpeza de HTML (<br>)
        const clean = (text: string) => {
            if (!text) return "";
            return text
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .trim();
        };

        // Montagem da letra
        let lyrics = "";
        const coro = clean(item.coro);
        const versesObj = item.verses || {};
        const vKeys = Object.keys(versesObj).sort((a, b) => parseInt(a) - parseInt(b));

        vKeys.forEach((vKey, index) => {
            lyrics += `${clean(versesObj[vKey])}\n\n`;
            // Adiciona o coro após a primeira estrofe (padrão)
            if (index === 0 && coro) {
                lyrics += `[Refrão]\n${coro}\n\n`;
            }
        });

        // Se não tiver versos numerados, mas tiver coro
        if (lyrics === "" && coro) lyrics = coro;

        processedHymns.push({
            number: parseInt(key),
            title: title,
            lyrics: lyrics.trim()
        });
    }

    const sortedHymns = processedHymns.sort((a, b) => a.number - b.number);

    // 3. Salva no Cache
    try {
        localStorage.setItem(HARPA_CACHE_KEY, JSON.stringify(sortedHymns));
    } catch (cacheError) {
        console.warn("[Harpa] Memória cheia, não foi possível salvar offline:", cacheError);
    }

    return sortedHymns;

  } catch (error) {
    console.error("[Harpa] Erro no download:", error);
    // 4. Se der erro (sem internet na primeira vez), usa o Fallback
    return FALLBACK_HYMNS;
  }
};

export const forceUpdateHymns = async (): Promise<Hymn[]> => {
    localStorage.removeItem(HARPA_CACHE_KEY);
    return getHarpaHymns();
};
