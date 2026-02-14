import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserArchetype, ResearchData, TeacherFeedback } from "../types";

// Global queue to serialize heavy requests (especially images) to stay within Free Tier limits
let apiQueue: Promise<any> = Promise.resolve();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to handle retries and rate limiting (429 errors)
 * Optimized for Free Tier limits by using longer exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 6000 // Slightly higher base delay for free tier
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isQuotaError =
      error?.status === 429 ||
      error?.code === 429 ||
      (error?.message && error.message.includes('429')) ||
      (error?.message && error.message.toLowerCase().includes('quota')) ||
      (error?.message && error.message.toLowerCase().includes('resource_exhausted'));

    if (isQuotaError && retries > 0) {
      console.warn(`Free Tier Rate limit hit. Retrying in ${baseDelay}ms...`);
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

const feedbackSchema = {
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
};

/**
 * Generate Archetypes from research data.
 */
export const generateArchetypesFromData = async (data: ResearchData): Promise<UserArchetype[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [{ parts: [{ text: `Synthesize this research data into 2-4 distinct behavioral User Archetypes. Ensure names are evocative. Data: "${JSON.stringify(data)}"` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: archetypeSchema,
        systemInstruction: "You are a world-class senior UX researcher. Synthesize behavioral patterns into archetypes. Avoid demographic tropes. Focus on 'How' and 'Why'. For 'tags', use concise behavioral labels.",
        temperature: 0.2
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const frameworkId = `fw-${Date.now()}`;

    return (parsed.archetypes || []).map((arch: any, index: number) => ({
      ...arch,
      category: data.stakeholderTag.trim() || "General",
      researcherName: data.researcherName,
      teamName: data.teamName,
      sourceResearch: data,
      frameworkId: frameworkId,
      id: `arch-${Date.now()}-${index}`
    }));
  });
};

/**
 * Evaluate research data for quality.
 * Optimized for maximum consistency and fair progress tracking.
 */
export const generateTeacherFeedback = async (data: ResearchData, previousFeedback?: TeacherFeedback | null): Promise<TeacherFeedback> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const promptContext = previousFeedback 
    ? `The student previously received an assessment with the following improvement points: ${JSON.stringify(previousFeedback.improvements)}. 
       Current Score: ${previousFeedback.score}.
       
       Task:
       1. Check if the student addressed the improvement points in their new data: ${JSON.stringify(data)}.
       2. For every point addressed, REMOVE it from the improvements list and INCREASE the score.
       3. DO NOT add new improvement points if the original list is being cleared. The goal is to reach 100 XP.
       4. If all points are addressed and content is robust, set score to 100 and Grade to A+.`
    : `Strictly evaluate these research notes based on the provided grading rubric. Data: ${JSON.stringify(data)}`;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: promptContext }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: feedbackSchema,
        temperature: 0, // Deterministic output
        seed: 42,       // Fixed seed for repeatable results
        systemInstruction: `You are a rigorous UX Research Professor. Evaluate work with extreme consistency.
        
        GRADING RUBRIC:
        - XP Score (0-100):
          - 0-30: Critically Underspecified. Single words or empty fields. (Grade: F)
          - 31-50: Superficial. Demographic assumptions or obvious tropes. (Grade: D or C-)
          - 51-70: Competent. Clear descriptions and distinct pain points. (Grade: C or B-)
          - 71-85: High Quality. Deep behavioral observations. (Grade: B+ or A-)
          - 86-100: Exceptional. Professional agency report quality. (Grade: A or A+)

        OBJECTIVE TRACKING:
        - If 'previousFeedback' is provided, your job is to track the student's progress against the flagged 'improvements'.
        - If they addressed an improvement point, reward them by removing it and raising the score.
        - DO NOT invent new issues if they are improving existing ones. Let them reach 100.
        - If the data hasn't changed, the score and grade MUST remain identical to the previous assessment.`
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

/**
 * Generate a persona portrait.
 */
export const generatePersonaImage = async (prompt: string): Promise<string> => {
  const task = async () => {
    // 5s gap for safety on Free Tier RPM
    await delay(5000);
    
    return await withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: `Professional studio headshot, cinematic lighting, neutral office background, highly detailed: ${prompt}` }] }],
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("No image part returned.");
    }, 2, 7000);
  };

  const execution = apiQueue.then(() => task());
  apiQueue = execution.then(() => {}).catch(() => {});
  return execution;
};