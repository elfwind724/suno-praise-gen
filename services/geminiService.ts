import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { ANALYSIS_SYSTEM_INSTRUCTION, GENERATION_SYSTEM_INSTRUCTION, OPTIMIZATION_SYSTEM_INSTRUCTION, ASSET_GENERATION_SYSTEM_INSTRUCTION } from "../constants";
import { LyricAnalysis, GeneratedSong, SongAssets } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.OBJECT,
      properties: {
        theology: { type: Type.NUMBER, description: "Score 0-100 for biblical depth and accuracy" },
        structure: { type: Type.NUMBER, description: "Score 0-100 for Suno structure and tags" },
        flow: { type: Type.NUMBER, description: "Score 0-100 for rhythm, rhyme, and singability" },
        imagery: { type: Type.NUMBER, description: "Score 0-100 for emotional impact and metaphor" },
        innovation: { type: Type.NUMBER, description: "Score 0-100 for creativity" },
      },
      required: ["theology", "structure", "flow", "imagery", "innovation"]
    },
    overallScore: { type: Type.NUMBER, description: "Average score 0-100" },
    feedback: { type: Type.STRING, description: "A professional summary critique of the lyrics (in Chinese)" },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of specific actionable improvements (in Chinese)"
    },
    sunoTagsCheck: {
      type: Type.OBJECT,
      properties: {
        valid: { type: Type.BOOLEAN, description: "Are the Suno tags valid?" },
        missingTags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of standard tags missing (e.g. Outro)" 
        },
        message: { type: Type.STRING, description: "Feedback on structure" }
      },
      required: ["valid", "missingTags", "message"]
    }
  },
  required: ["scores", "overallScore", "feedback", "suggestions", "sunoTagsCheck"]
};

const generationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Song title in Chinese" },
    stylePrompts: { type: Type.STRING, description: "English style tags for Suno" },
    negativePrompts: { type: Type.STRING, description: "Things to avoid" },
    lyrics: { type: Type.STRING, description: "The complete lyrics with tags, MUST start with [Intro]" },
  },
  required: ["title", "stylePrompts", "negativePrompts", "lyrics"]
};

const assetsSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        caption: { type: Type.STRING, description: "Viral social media caption with hashtags" },
        stylizedTitle: { type: Type.STRING, description: "Aesthetically designed title with unicode symbols" }
    },
    required: ["caption", "stylizedTitle"]
}

export const analyzeLyrics = async (lyrics: string): Promise<LyricAnalysis> => {
  try {
    const modelId = "gemini-2.5-flash";
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze the following Chinese worship lyrics for a Suno AI song generation:\n\n${lyrics}`,
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4, 
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as LyricAnalysis;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const optimizeLyrics = async (currentLyrics: string, suggestions: string[]): Promise<string> => {
    try {
        const modelId = "gemini-2.5-flash";
        const prompt = `Original Lyrics:\n${currentLyrics}\n\nFeedback to Apply:\n${suggestions.join('\n')}\n\nRewrite the lyrics to be perfect.`;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: OPTIMIZATION_SYSTEM_INSTRUCTION,
                temperature: 0.6
            }
        });
        
        let text = response.text || "";
        // Strip code blocks if they appear
        text = text.replace(/^```(json|text)?\n/g, '').replace(/\n```$/g, '');
        return text;
    } catch (error) {
        console.error("Optimization failed:", error);
        throw error;
    }
}

export const searchSunoTips = async (query: string): Promise<string> => {
  try {
    const modelId = "gemini-2.5-flash";
    const prompt = `Search for the latest tips and tricks for Suno AI V5, specifically focusing on: ${query}. 
    Summarize the findings into a helpful guide for a songwriter in Chinese. 
    Focus on tags, metatags, and style prompts.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    
    return response.text || "No results found.";

  } catch (error) {
    console.error("Search failed:", error);
    return "Unable to fetch real-time tips. Please try again later.";
  }
};

export const generateLyrics = async (prompt: string, style: string): Promise<GeneratedSong> => {
    try {
        const modelId = "gemini-2.5-flash";
        const fullPrompt = `Write a modern Chinese worship hymn.
        Theme: ${prompt}
        Style Reference: ${style}`;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: fullPrompt,
            config: {
                systemInstruction: GENERATION_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: generationSchema,
                temperature: 0.7
            }
        });

        if (response.text) {
             const data = JSON.parse(response.text) as GeneratedSong;
             // Safety check for [Intro]
             if (!data.lyrics.trim().toLowerCase().startsWith("[intro]")) {
                 data.lyrics = "[Intro]\n(Atmospheric build up)\n\n" + data.lyrics;
             }
             return data;
        }
        throw new Error("No response text");
    } catch (error) {
        console.error("Generation failed", error);
        throw error;
    }
}

export const generateSongAssets = async (title: string, lyrics: string, style: string): Promise<SongAssets> => {
    try {
        const modelId = "gemini-2.5-flash";
        const prompt = `Song Title: ${title}\nStyle: ${style}\nLyrics: ${lyrics.substring(0, 500)}...`;
        
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: ASSET_GENERATION_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: assetsSchema,
                temperature: 0.8
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as SongAssets;
        }
        return { caption: "Check out my new song!", stylizedTitle: title };
    } catch (error) {
        console.error("Asset generation failed", error);
        throw error;
    }
}

export const generateCoverImage = async (title: string, lyrics: string): Promise<string> => {
    try {
        // Switched to gemini-2.5-flash-image for better availability/compatibility
        // 'imagen-3.0' models often return 404 if not specifically enabled on the project
        const modelId = "gemini-2.5-flash-image";
        
        const prompt = `A high quality, artistic album cover for a modern christian worship song titled "${title}". 
        Visual themes based on lyrics: ${lyrics.substring(0, 100)}. 
        Cinematic lighting, ethereal, hopeful, 8k resolution, digital art style, no text.`;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });
        
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part && part.inlineData && part.inlineData.data) {
             return part.inlineData.data;
        }
        throw new Error("No image generated");
    } catch (error) {
        console.error("Image generation failed", error);
        throw error;
    }
}