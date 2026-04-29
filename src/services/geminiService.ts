import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    if (!API_KEY) {
       // In AI Studio, the key is provided in the environment.
       // Failure to find it usually means a config issue.
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
}

export async function getSensoryRecommendation(mood: string) {
  try {
    const client = getAI();
    const prompt = `
      You are a high-end restaurant's AI sensory concierge. 
      The guest is feeling: "${mood}".
      
      Suggest a 3-course meal (Starter, Main, Dessert) and a signature drink that matches this mood perfectly.
      Also, describe the "Atmospheric Setting" (lighting, music style, table orientation) to complement the meal.
      
      Format the response in JSON:
      {
        "starter": { "name": "...", "description": "..." },
        "main": { "name": "...", "description": "..." },
        "dessert": { "name": "...", "description": "..." },
        "drink": { "name": "...", "description": "..." },
        "atmosphere": "..."
      }
    `;

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("Empty AI response");
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return null;
  }
}
