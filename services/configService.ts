import { RadioConfig } from '../types';

// URL fornecida pelo usuário
const USER_PROVIDED_URL = 'https://raw.githubusercontent.com/llkrafael-alt/adchegatudo/refs/heads/main/meu-arquivo.json';

// Configuração Padrão (Fallback) - Agora com o seu link da Zeno FM!
// Se o arquivo do GitHub falhar, o app usará estas configurações.
const DEFAULT_CONFIG: RadioConfig = {
  churchName: "AD Chega Tudo",
  streamUrl: "https://stream.zeno.fm/0r0xa792kwzuv", 
  images: [
    "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1920&auto=format&fit=crop"
  ],
  primaryColor: "#3b82f6"
};

// Função auxiliar para corrigir URLs do GitHub Raw
const normalizeGithubUrl = (url: string): string => {
  if (!url) return "";
  if (url.includes('raw.githubusercontent.com') && url.includes('/refs/heads/')) {
    return url.replace('/refs/heads/', '/');
  }
  return url;
};

export const getRadioConfig = async (): Promise<RadioConfig & { error?: string }> => {
  // Se não houver URL configurada, usa o padrão imediatamente
  if (!USER_PROVIDED_URL) return DEFAULT_CONFIG;

  // 1. Prepara URLs para tentar (Original e Corrigida)
  const urlsToTry = [
    normalizeGithubUrl(USER_PROVIDED_URL), // Tenta a corrigida primeiro
    USER_PROVIDED_URL // Tenta a original depois
  ];

  // Remove duplicatas
  const uniqueUrls = [...new Set(urlsToTry)];
  let lastError = "";

  console.log(`[Config] URLs para tentativa:`, uniqueUrls);

  for (const url of uniqueUrls) {
    try {
      // Adiciona timestamp para quebrar cache do navegador e forçar leitura nova
      const fetchUrl = `${url}?t=${Date.now()}`;
      
      console.log(`[Config] Buscando: ${fetchUrl}`);
      const response = await fetch(fetchUrl);

      if (!response.ok) {
        console.warn(`[Config] Falha ao baixar ${url}. Status: ${response.status}`);
        lastError = `Erro HTTP ${response.status} ao baixar arquivo.`;
        continue;
      }

      const textData = await response.text();
      
      try {
        const json = JSON.parse(textData);
        
        // Mapeamento Flexível
        const foundStreamUrl = json.streamUrl || json.stream || json.url || json.radio || json.link;
        const foundName = json.churchName || json.name || json.title || "Web Rádio";
        
        // --- LÓGICA DE TRATAMENTO DE IMAGENS ROBUSTA ---
        let rawImages = json.images || json.imgs || json.photos || json.backgrounds || [];
        let processedImages: string[] = [];

        if (Array.isArray(rawImages)) {
            // Se for array (ex: ["url1", "url2"]), limpa strings vazias e não-strings
            processedImages = rawImages
                .filter(item => typeof item === 'string' && item.trim() !== "")
                .map(item => item.trim());
        } else if (typeof rawImages === 'string') {
            // Se for string única
            const trimmed = rawImages.trim();
            if (trimmed.length > 0) {
                // Verifica se o usuário separou por vírgula (ex: "url1, url2")
                if (trimmed.includes(',')) {
                    processedImages = trimmed.split(',').map(s => s.trim()).filter(s => s !== "");
                } else {
                    // É apenas uma URL simples
                    processedImages = [trimmed];
                }
            }
        }

        // FILTRO DE SEGURANÇA: Remove o ícone se ele tiver entrado na lista de imagens por engano
        const filteredImages = processedImages.filter((img: string) => !img.toLowerCase().includes('icon.png'));

        if (foundStreamUrl) {
          console.log("[Config] Sucesso! Configuração válida encontrada na nuvem.");
          console.log("[Config] Imagens carregadas:", filteredImages);
          
          return {
            churchName: foundName,
            streamUrl: foundStreamUrl,
            images: filteredImages.length > 0 ? filteredImages : DEFAULT_CONFIG.images,
            primaryColor: json.primaryColor || DEFAULT_CONFIG.primaryColor
          };
        } else {
           throw new Error("JSON existe mas não contém 'streamUrl'");
        }

      } catch (jsonError: any) {
        console.error("[Config] Erro ao processar JSON da nuvem:", jsonError);
        // Armazena o erro específico de sintaxe para mostrar ao usuário
        lastError = `Erro de sintaxe no JSON: ${jsonError.message}. Verifique vírgulas extras.`;
      }

    } catch (error: any) {
      console.error(`[Config] Erro na tentativa ${url}:`, error);
      if (!lastError) lastError = error.message;
    }
  }

  // Se chegou aqui, todas as tentativas falharam.
  // Retornamos o DEFAULT_CONFIG com a mensagem de erro anexada.
  console.warn("[Config] Todas as tentativas remotas falharam. Usando configuração padrão (fallback).");
  
  return {
    ...DEFAULT_CONFIG,
    error: lastError || "Falha desconhecida ao carregar configuração."
  };
};