import { GoogleGenAI, Type } from "@google/genai";
import { Song, SongNote } from "../types";
import { PIANO_NOTES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const availableNotes = PIANO_NOTES.map(n => n.note).join(", ");

export const generateSong = async (topic: string, difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<Song> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a playable piano song for a beginner web game.
      Topic: ${topic}
      Difficulty: ${difficulty}
      
      Available Notes: ${availableNotes}
      Rules:
      1. Use ONLY the available notes listed above. Do not use notes outside this range.
      2. The song should be melodious and rhythmic.
      3. "startTime" is in milliseconds. Ensure notes don't overlap too much for beginners.
      4. Total duration should be around 10-15 seconds.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            bpm: { type: Type.NUMBER },
            notes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  noteName: { type: Type.STRING },
                  startTime: { type: Type.NUMBER },
                  duration: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Transform into our Song interface with IDs
    const notes: SongNote[] = (data.notes || []).map((n: any, index: number) => ({
      ...n,
      id: `gen-${index}`,
      hit: false
    }));

    return {
      title: data.title || "AI Generated Song",
      description: data.description || "A unique melody created by Gemini.",
      difficulty: difficulty,
      bpm: data.bpm || 100,
      notes: notes
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate song");
  }
};