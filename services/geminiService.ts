import { GoogleGenAI, Type } from "@google/genai";
import { DailyMessage } from "../types";

// CORREÇÃO DE BUILD: Ensina ao TypeScript que 'process' existe neste contexto
declare const process: { env: { API_KEY: string } };

const CACHE_KEY = 'daily_message_cache_v1';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDailyMessage = async (): Promise<DailyMessage> => {
  // 1. Verifica se já existe uma mensagem salva para HOJE
  const today = new Date().toLocaleDateString('pt-BR'); // Ex: 27/10/2023
  
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      // Se a data salva for igual a data de hoje, retorna o que está salvo
      if (parsedCache.date === today) {
        console.log("Usando versículo do dia em cache.");
        return parsedCache.message;
      }
    }
  } catch (e) {
    console.warn("Erro ao ler cache local", e);
  }

  // 2. Se não tem cache ou mudou o dia, chama a IA
  try {
    const ai = getClient();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Gere um versículo bíblico encorajador e um pensamento curto e inspirador para os ouvintes de uma rádio evangélica. Responda estritamente em JSON.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verse: { type: Type.STRING, description: "O texto do versículo bíblico" },
            reference: { type: Type.STRING, description: "A referência bíblica (ex: João 3:16)" },
            thought: { type: Type.STRING, description: "Uma frase curta de encorajamento baseada no versículo" }
          },
          required: ["verse", "reference", "thought"]
        }
      }
    });

    if (response.text) {
      const newMessage = JSON.parse(response.text) as DailyMessage;
      
      // 3. Salva a nova mensagem no cache com a data de hoje
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        date: today,
        message: newMessage
      }));
      
      return newMessage;
    }
    
    throw new Error("No text in response");

  } catch (error) {
    console.error("Error fetching daily message:", error);
    // Fallback content in case of API error (Não salvamos no cache para tentar novamente depois)
    return {
      verse: "O Senhor é o meu pastor, nada me faltará.",
      reference: "Salmos 23:1",
      thought: "Confie no cuidado de Deus para sua vida hoje."
    };
  }
};