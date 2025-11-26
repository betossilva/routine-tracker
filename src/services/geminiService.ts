
import { GoogleGenAI } from "@google/genai";
import { DailyLog, TimeRange } from "../types";

export const generateRoutineReport = async (logs: DailyLog[], range: TimeRange, userName?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Filter logs based on range
  const now = new Date();
  let filteredLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  let rangeText = "";
  if (range === TimeRange.WEEK) {
    filteredLogs = filteredLogs.slice(0, 7);
    rangeText = "últimos 7 dias";
  } else if (range === TimeRange.MONTH) {
    filteredLogs = filteredLogs.slice(0, 30);
    rangeText = "últimos 30 dias";
  } else if (range === TimeRange.YEAR) {
    filteredLogs = filteredLogs.slice(0, 365);
    rangeText = "último ano";
  }

  if (filteredLogs.length === 0) {
    return "Ainda não há dados suficientes neste período para gerar um relatório.";
  }

  const contextData = JSON.stringify(filteredLogs, null, 2);

  const prompt = `
    Atue como um nutricionista e coach de alta performance.
    ${userName ? `IMPORTANTE: Inicie o relatório cumprimentando o usuário pelo nome: ${userName}.` : ''}
    
    Analise o histórico de rotina do usuário referente ao período: **${rangeText}**.
    
    DADOS (JSON):
    ${contextData}

    TAREFA:
    Gere um relatório em formato Markdown. Seja motivador, mas realista. Considere o sono como fator fundamental se houver dados.
    
    ESTRUTURA DO RELATÓRIO:
    1. **Olá, [Nome]! Resumo do ${range === TimeRange.YEAR ? 'Ano' : range === TimeRange.MONTH ? 'Mês' : 'Semana'}**: Uma visão geral do desempenho (consistência geral em dieta, treino e sono).
    2. **Destaques Positivos**: O que o usuário fez bem?
    3. **Análise de Tendências**: ${range === TimeRange.YEAR ? 'Identifique meses de alta e baixa.' : 'Identifique dias ou horários onde a rotina falha.'}
    4. **Plano de Ação**: 2 sugestões práticas para melhorar no próximo ciclo.

    Use emojis para tornar a leitura fluida. Mantenha o tom profissional e encorajador.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Não foi possível gerar o relatório no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Desculpe, ocorreu um erro ao analisar seus dados. Verifique sua chave de API ou conexão.";
  }
};
