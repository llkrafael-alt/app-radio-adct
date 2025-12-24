import { GoogleGenAI, Type } from "@google/genai";
import { DailyMessage } from "../types";

declare const process: { env: { API_KEY: string } };

const CACHE_KEY = 'daily_message_cache_v1';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "") {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Erro ao inicializar GoogleGenAI:", e);
    return null;
  }
};

export const generateDailyMessage = async (): Promise<DailyMessage> => {
  const fallback = {
    verse: "O Senhor é o meu pastor, nada me faltará.",
    reference: "Salmos 23:1",
    thought: "Confie no cuidado de Deus para sua vida hoje."
  };

  const today = new Date().toLocaleDateString('pt-BR');
  
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      if (parsedCache.date === today) {
        return parsedCache.message;
      }
    }
  } catch (e) {}

  const ai = getClient();
  if (!ai) return fallback;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Gere um versículo bíblico encorajador e um pensamento curto e inspirador para os ouvintes de uma rádio evangélica. Responda estritamente em JSON.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verse: { type: Type.STRING },
            reference: { type: Type.STRING },
            thought: { type: Type.STRING }
          },
          required: ["verse", "reference", "thought"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const newMessage = JSON.parse(text) as DailyMessage;
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        date: today,
        message: newMessage
      }));
      return newMessage;
    }
    return fallback;
  } catch (error) {
    console.warn("Erro ao gerar mensagem com Gemini:", error);
    return fallback;
  }
};