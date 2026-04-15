import { GoogleGenAI } from "@google/genai";
import { Medication, Allergy } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeInteractions(medications: Medication[], allergies: Allergy[]) {
  if (medications.length === 0) return "Adicione medicações para analisar interações.";

  const medList = medications.map(m => `${m.name} (${m.dosage}, ${m.frequency})`).join(", ");
  const allergyList = allergies.map(a => `${a.substance}: ${a.reaction}`).join(", ");

  const prompt = `
    Você é um farmacêutico clínico especialista em farmacologia.
    Analise a seguinte lista de medicamentos de um paciente e identifique potenciais interações medicamentosas (fármaco-fármaco, fármaco-alimento) e riscos baseados no histórico de alergias.

    Medicamentos: ${medList}
    Alergias: ${allergyList || "Nenhuma relatada"}

    Forneça uma análise estruturada contendo:
    1. Interações Potenciais (Gravidade: Alta, Média, Baixa)
    2. Riscos de Alergia
    3. Recomendações para o Farmacêutico (ajustes de horário, monitoramento de sinais, etc.)

    Responda em Português (Brasil) de forma profissional e concisa.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing interactions:", error);
    return "Erro ao analisar interações. Verifique sua conexão ou tente novamente mais tarde.";
  }
}
