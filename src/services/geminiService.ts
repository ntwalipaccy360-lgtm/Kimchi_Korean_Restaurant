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
      
      Finally, provide a "visualPrompt" which is a highly detailed, artistic description for an image generation model to create a cinematic, photorealistic representation of the main dish in the described atmosphere.
      
      Format the response in JSON:
      {
        "starter": { "name": "...", "description": "..." },
        "main": { "name": "...", "description": "..." },
        "dessert": { "name": "...", "description": "..." },
        "drink": { "name": "...", "description": "..." },
        "atmosphere": "...",
        "visualPrompt": "..."
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

export async function generateDiscoveryImage(visualPrompt: string) {
  try {
    const client = getAI();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A hyper-realistic, cinematic fine-dining food photograph of the following scene: ${visualPrompt}. 8k resolution, elegant lighting, shallow depth of field, vibrant colors, artistic composition.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Discovery Image Generation Error:", error);
    return null;
  }
}

export async function getPairingRecommendation(itemName: string, itemDescription: string) {
  try {
    const client = getAI();
    const prompt = `
      You are a Michelin-star Sommelier and Korean Culinary Expert.
      The dish is: "${itemName}".
      Description: "${itemDescription}".

      Suggest:
      1. A Drink Pairing (Alcoholic or Non-Alcoholic, explaining why the notes complement the dish).
      2. A "Secret" Spice or Condiment that would elevate the dish.
      3. A sensory description of the first bite.

      Format the response in JSON:
      {
        "pairing": "...",
        "secretSpice": "...",
        "sensoryExperience": "..."
      }
    `;

    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
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
    console.error("Pairing Suggestion Error:", error);
    return null;
  }
}
