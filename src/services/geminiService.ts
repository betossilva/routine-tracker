
import { GoogleGenAI } from "@google/genai";
import { DailyLog, ChatMessage, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendMessageToGemini = async (
  message: string,
  history: ChatMessage[],
  logs: DailyLog[],
  user: UserProfile | null
): Promise<string> => {
  
  // Prepara o contexto de dados (últimos 14 dias para não exceder tokens desnecessariamente)
  // Ordena do mais recente para o mais antigo, pega 14, e inverte para cronológico
  const sortedLogs = [...logs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 14)
    .reverse();

  const contextData = JSON.stringify(sortedLogs, null, 2);
  const userName = user?.name || "Usuário";

  const systemInstruction = `
    Você é o 'RoutineCoach', um nutricionista, personal trainer e coach de hábitos altamente qualificado e empático.
    
    PERFIL DO USUÁRIO:
    Nome: ${userName}
    
    DADOS RECENTES (Últimos 14 dias):
    ${contextData}

    DIRETRIZES:
    1. Você tem acesso aos logs de rotina do usuário (Sono, Alimentação, Treino). Use esses dados para basear suas respostas.
    2. Seja motivador, positivo, mas realista.
    3. Se o usuário perguntar sobre "hoje", verifique a data mais recente nos dados.
    4. Respostas devem ser formatadas em Markdown.
    5. Mantenha as respostas concisas (máximo 3 parágrafos), a menos que o usuário peça um relatório detalhado.
    6. Use emojis para tornar a conversa leve.
    
    Se o usuário pedir um relatório ou análise, faça uma leitura crítica dos hábitos (consistência de treino, qualidade do sono, etc) e sugira melhorias.
  `;

  try {
    // Converte o histórico do app para o formato da API
    // Limitamos o histórico às últimas 10 mensagens para manter o contexto focado e rápido
    const chatHistory = history.slice(-10).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Adiciona a mensagem atual
    const contents = [
      ...chatHistory,
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { systemInstruction },
      contents: contents,
    });
    
    return response.text || "Não consegui gerar uma resposta agora.";
  } catch (error) {
    console.error("Erro no chat Gemini:", error);
    return "Desculpe, estou tendo problemas para processar sua mensagem agora. Verifique sua conexão.";
  }
};
