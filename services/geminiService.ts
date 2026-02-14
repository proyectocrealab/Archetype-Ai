import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserArchetype, ResearchData, TeacherFeedback } from "../types";

// Dynamic key retrieval
const getApiKey = () => {
  return process.env.API_KEY || "";
};

// Queue for serializing heavy requests
let apiQueue: Promise<any> = Promise.resolve();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 6000 
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isQuotaError =
      error?.status === 429 ||
      error?.code === 429 ||
      (error?.message && error.message.includes('429')) ||
      (error?.message && error.message.toLowerCase().includes('quota'));

    if (isQuotaError && retries > 0) {
      await delay(baseDelay);
      return withRetry(operation, retries - 1, baseDelay * 2);
    }
    throw error;
  }
}

const archetypeSchema = {
  type: Type.OBJECT,
  properties: {
    archetypes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          age: { type: Type.INTEGER },
          quote: { type: Type.STRING },
          bio: { type: Type.STRING },
          goals: { type: Type.ARRAY, items: { type: Type.STRING } },
          frustrations: { type: Type.ARRAY, items: { type: Type.STRING } },
          motivations: { type: Type.ARRAY, items: { type: Type.STRING } },
          techLiteracy: { type: Type.INTEGER },
          personalityTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
          imagePrompt: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "role", "age", "quote", "bio", "goals", "frustrations", "motivations", "techLiteracy", "personalityTraits", "imagePrompt", "tags"]
      }
    }
  },
  required: ["archetypes"]
};

export const generateArchetypesFromData = async (data: ResearchData): Promise<UserArchetype[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Please configure your Gemini API key in the settings.");
  
  const ai = new GoogleGenAI({ apiKey });
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [{ parts: [{ text: `Synthesize this research data into 2-4 distinct behavioral User Archetypes: "${JSON.stringify(data)}"` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: archetypeSchema,
        systemInstruction: "You are a senior UX researcher. Synthesize behavioral patterns into evocative archetypes. Focus on goals and motivations over demographics.",
        temperature: 0.2
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const frameworkId = `fw-${Date.now()}`;

    return (parsed.archetypes || []).map((arch: any, index: number) => ({
      ...arch,
      category: data.stakeholderTag || "General",
      researcherName: data.researcherName,
      teamName: data.teamName,
      sourceResearch: data,
      frameworkId: frameworkId,
      id: `arch-${Date.now()}-${index}`
    }));
  });
};

export const generateTeacherFeedback = async (data: ResearchData, previousFeedback?: TeacherFeedback | null): Promise<TeacherFeedback> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing.");
  const ai = new GoogleGenAI({ apiKey });
  
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Audit this UX research data: ${JSON.stringify(data)}` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grade: { type: Type.STRING },
            score: { type: Type.INTEGER },
            feedbackTitle: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            thoughtProvokingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            overallComment: { type: Type.STRING }
          },
          required: ["grade", "score", "feedbackTitle", "strengths", "improvements", "thoughtProvokingQuestions", "overallComment"]
        },
        systemInstruction: "You are a UX Professor. Audit the quality of research data. Be rigorous but constructive."
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generatePersonaImage = async (prompt: string): Promise<string> => {
  const task = async () => {
    await delay(2000);
    return await withRetry(async () => {
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: `Professional studio headshot: ${prompt}` }] }],
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data found.");
    });
  };

  const execution = apiQueue.then(() => task());
  apiQueue = execution.then(() => {}).catch(() => {});
  return execution;
};