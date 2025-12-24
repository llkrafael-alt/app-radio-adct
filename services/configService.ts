import { RadioConfig } from '../types';

// URL do arquivo de configuração no GitHub
const USER_PROVIDED_URL = 'https://raw.githubusercontent.com/llkrafael-alt/adchegatudo/main/meu-arquivo.json';

export const DEFAULT_CONFIG: RadioConfig = {
  churchName: "AD Chega Tudo",
  streamUrl: "https://stream.zeno.fm/0r0xa792kwzuv", 
  images: [
    "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1920&auto=format&fit=crop"
  ],
  primaryColor: "#3b82f6"
};

export const getRadioConfig = async (): Promise<RadioConfig> => {
  try {
    const response = await fetch(`${USER_PROVIDED_URL}?t=${Date.now()}`);
    if (!response.ok) throw new Error("Falha ao carregar arquivo de configuração remoto.");
    
    const json = await response.json();
    
    // Mapeamento inteligente e tolerante a diferentes nomes de chaves no JSON
    const config: RadioConfig = {
      // Tenta buscar o nome em 'churchName' ou 'name'
      churchName: json.churchName || json.name || DEFAULT_CONFIG.churchName,
      
      // Tenta buscar o link em 'streamUrl', 'stream', 'url' ou 'link'
      streamUrl: json.streamUrl || json.stream || json.url || json.link || DEFAULT_CONFIG.streamUrl,
      
      // Garante que images seja um array válido
      images: Array.isArray(json.images) && json.images.length > 0 ? json.images : DEFAULT_CONFIG.images,
      
      // Tenta buscar a cor em 'primaryColor' ou 'color'
      primaryColor: json.primaryColor || json.color || DEFAULT_CONFIG.primaryColor
    };

    console.log("[ConfigService] Configurações carregadas com sucesso do JSON:", config);
    return config;
  } catch (error) {
    console.warn("[ConfigService] Usando configuração padrão devido a erro no fetch:", error);
    return DEFAULT_CONFIG;
  }
};