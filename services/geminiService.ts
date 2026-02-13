import { GoogleGenAI, Type } from "@google/genai";
import { UserArchetype, ResearchData, TeacherFeedback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema definition for the archetypes
const archetypeSchema = {
  type: Type.OBJECT,
  properties: {
    archetypes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "A realistic full name for the persona." },
          role: { type: Type.STRING, description: "Job title or primary role (e.g., 'Busy Parent', 'Senior Developer')." },
          age: { type: Type.INTEGER, description: "Age of the persona." },
          quote: { type: Type.STRING, description: "A characteristic quote that captures their attitude." },
          bio: { type: Type.STRING, description: "A short biography (2-3 sentences)." },
          goals: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-5 key goals or needs." 
          },
          frustrations: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-5 key pain points or frustrations." 
          },
          motivations: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3 key drivers for their behavior." 
          },
          techLiteracy: { type: Type.INTEGER, description: "Score from 1 (Low) to 10 (High)." },
          personalityTraits: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "4-5 adjectives describing personality (e.g., 'Analytical', 'Impulsive')." 
          },
          imagePrompt: { type: Type.STRING, description: "A detailed physical description to generate a photorealistic headshot." }
        },
        required: ["name", "role", "age", "quote", "bio", "goals", "frustrations", "motivations", "techLiteracy", "personalityTraits", "imagePrompt"]
      }
    }
  },
  required: ["archetypes"]
};

// Schema for Teacher Feedback
const feedbackSchema = {
  type: Type.OBJECT,
  properties: {
    grade: { type: Type.STRING, description: "A letter grade (A+, A, B, C, D, F) based on the depth and quality of the research notes." },
    score: { type: Type.INTEGER, description: "A numeric score from 0-100." },
    feedbackTitle: { type: Type.STRING, description: "A short, punchy title for the feedback (e.g., 'Great behavioral insights!', 'Dig deeper into motivations')." },
    strengths: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "2-3 bullet points highlighting what the student did well." 
    },
    improvements: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "2-3 specific, actionable tips to improve the data quality." 
    },
    thoughtProvokingQuestions: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "2 questions that challenge the student to think deeper about their users." 
    },
    overallComment: { type: Type.STRING, description: "A short, encouraging paragraph from the professor's perspective." }
  },
  required: ["grade", "score", "feedbackTitle", "strengths", "improvements", "thoughtProvokingQuestions", "overallComment"]
};

export const generateArchetypesFromData = async (inputData: string): Promise<UserArchetype[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        You are an expert User Researcher and UX Designer. 
        Analyze the following raw research data (interview notes, survey responses, or descriptions) and synthesize it into distinct User Archetypes.
        Focus on behavioral patterns, goals, and pain points.
        
        Raw Data:
        "${inputData}"
        
        Generate 2 to 4 distinct archetypes that represent the key segments found in this data.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: archetypeSchema,
        systemInstruction: "You are a precise and insightful UX researcher. Create realistic, empathetic, and useful personas."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);
    
    // Add local IDs
    return parsed.archetypes.map((arch: any, index: number) => ({
      ...arch,
      id: `arch-${Date.now()}-${index}`
    }));

  } catch (error) {
    console.error("Error generating archetypes:", error);
    throw error;
  }
};

export const generateTeacherFeedback = async (data: ResearchData): Promise<TeacherFeedback> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are "Professor Archetype", a supportive but rigorous UX Design professor at a top design university.
        A student has just submitted their initial research notes for their User Archetype project.
        
        Student: ${data.studentName}
        Team: ${data.teamName}
        
        Your goal is to gamify their progress. Review their notes for depth, specificity, and empathy.
        Address the student by name if possible.
        
        Criteria for grading:
        - Specificity: Are there specific details or just generalizations?
        - Separation: Did they actually list behaviors in "Actions" and drivers in "Motivations"?
        - Empathy: Do they understand the user's pain?
        - Completeness: Is there enough data to build a persona?

        Student's Work:
        Title: ${data.title}
        Description: ${data.description}
        Pain Points: ${data.painPoints}
        Needs: ${data.needs}
        Goals: ${data.goals}
        Actions: ${data.actions}

        Provide constructive feedback, a grade, and questions to inspire them to edit and improve their notes before generating the final personas.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: feedbackSchema,
        systemInstruction: "You are a gamified tutor. Be energetic, encouraging, but honest about gaps in the research."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as TeacherFeedback;

  } catch (error) {
    console.error("Error generating feedback:", error);
    throw error;
  }
};

export const generatePersonaImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: `A high-quality, professional headshot of: ${prompt}. Photorealistic, neutral lighting, solid color background, looking at camera. 4k resolution.`
        }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    // Extract image from parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};