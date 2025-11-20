import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { ANALYSIS_SYSTEM_INSTRUCTION, GENERATION_SYSTEM_INSTRUCTION, OPTIMIZATION_SYSTEM_INSTRUCTION, ASSET_GENERATION_SYSTEM_INSTRUCTION } from "../constants";
import { LyricAnalysis, GeneratedSong, SongAssets, AISettings, AIProvider } from "../types";

// --- Helper for Zhipu API ---
const callZhipuAPI = async (apiKey: string, messages: any[], jsonMode: boolean = false, systemPrompt?: string) => {
  if (!apiKey) throw new Error("Zhipu API Key is missing");

  // Construct messages array with system prompt if provided
  const finalMessages = [];
  if (systemPrompt) {
    finalMessages.push({ role: "system", content: systemPrompt });
  }
  finalMessages.push(...messages);

  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "glm-4.6",
        messages: finalMessages,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 4096,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Zhipu API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Zhipu Call Failed:", error);
    throw error;
  }
};

// --- Helper for Gemini API ---
const getGeminiClient = (apiKey: string) => {
    if (!apiKey) throw new Error("Gemini API Key is missing");
    return new GoogleGenAI({ apiKey });
};


// --- Schemas (Kept for Gemini, translated to text prompts for Zhipu) ---
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
    suggestedSettings: {
        type: Type.OBJECT,
        properties: {
            weirdness: { type: Type.NUMBER, description: "Value 1-10. 1 is standard, 10 is experimental." },
            styleInfluence: { type: Type.NUMBER, description: "Value 1-10. 1 is low adherence, 10 is strict." },
            vocalGender: { type: Type.STRING, enum: ["Male", "Female"], description: "Suggested vocal gender" }
        },
        required: ["weirdness", "styleInfluence", "vocalGender"]
    }
  },
  required: ["title", "stylePrompts", "negativePrompts", "lyrics", "suggestedSettings"]
};

const assetsSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        caption: { type: Type.STRING, description: "Viral social media caption with hashtags" },
        stylizedTitle: { type: Type.STRING, description: "Aesthetically designed title with unicode symbols" }
    },
    required: ["caption", "stylizedTitle"]
}


// --- Exported Functions ---

export const analyzeLyrics = async (lyrics: string, settings: AISettings): Promise<LyricAnalysis> => {
  try {
    if (settings.provider === AIProvider.ZHIPU) {
        const prompt = `Analyze the following Chinese worship lyrics for Suno AI. \n\nLYRICS:\n${lyrics}\n\n
        Return a valid JSON object with this structure:
        {
            "scores": { "theology": 0-100, "structure": 0-100, "flow": 0-100, "imagery": 0-100, "innovation": 0-100 },
            "overallScore": 0-100,
            "feedback": "Summary string",
            "suggestions": ["Suggestion 1", "Suggestion 2"],
            "sunoTagsCheck": { "valid": boolean, "missingTags": [], "message": "Feedback" }
        }`;
        const text = await callZhipuAPI(settings.zhipuKey, [{ role: "user", content: prompt }], true, ANALYSIS_SYSTEM_INSTRUCTION);
        return JSON.parse(text);
    } else {
        const ai = getGeminiClient(settings.geminiKey);
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Analyze the following Chinese worship lyrics for a Suno AI song generation:\n\n${lyrics}`,
          config: {
            systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
            temperature: 0.4, 
          }
        });
        if (response.text) return JSON.parse(response.text) as LyricAnalysis;
        throw new Error("No response text from Gemini");
    }
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const optimizeLyrics = async (currentLyrics: string, suggestions: string[], settings: AISettings): Promise<string> => {
    try {
        const prompt = `Original Lyrics:\n${currentLyrics}\n\nFeedback to Apply:\n${suggestions.join('\n')}\n\nRewrite the lyrics to be perfect. Return ONLY the lyrics text.`;

        if (settings.provider === AIProvider.ZHIPU) {
            return await callZhipuAPI(settings.zhipuKey, [{ role: "user", content: prompt }], false, OPTIMIZATION_SYSTEM_INSTRUCTION);
        } else {
            const ai = getGeminiClient(settings.geminiKey);
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    systemInstruction: OPTIMIZATION_SYSTEM_INSTRUCTION,
                    temperature: 0.6
                }
            });
            let text = response.text || "";
            text = text.replace(/^```(json|text)?\n/g, '').replace(/\n```$/g, '');
            return text;
        }
    } catch (error) {
        console.error("Optimization failed:", error);
        throw error;
    }
}

export const searchSunoTips = async (query: string, settings: AISettings): Promise<string> => {
  const prompt = `Search for the latest tips and tricks for Suno AI V5, specifically focusing on: ${query}. 
    Summarize the findings into a helpful guide for a songwriter in Chinese. 
    Focus on tags, metatags, and style prompts.`;

  try {
    if (settings.provider === AIProvider.ZHIPU) {
        // GLM-4.6 supports built-in web search capabilities via 'tools' or intrinsic knowledge. 
        // Using the standard prompt often triggers their browser if enabled, or we rely on knowledge.
        // Explicitly enabling web_search tool for Zhipu if available in their specific SDK wrapper, 
        // but via standard chat/completions, we just ask.
        // The prompt provided implies GLM-4.6 has "Network Search".
        return await callZhipuAPI(settings.zhipuKey, [{ role: "user", content: prompt }], false, "You are a helpful assistant with access to real-time information about AI music generation.");
    } else {
        const ai = getGeminiClient(settings.geminiKey);
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          }
        });
        return response.text || "No results found.";
    }
  } catch (error) {
    console.error("Search failed:", error);
    return "Unable to fetch tips. Please check your API configuration.";
  }
};

export const generateLyrics = async (prompt: string, style: string, settings: AISettings): Promise<GeneratedSong> => {
    const fullPrompt = `Write a modern Chinese worship hymn.
        Theme: ${prompt}
        Style Reference: ${style}
        
        IMPORTANT:
        - Weirdness (1-10): How experimental?
        - Style Influence (1-10): How strict to style?
        - Vocal Gender: Male or Female?
        - Negative Prompts: If worship/soft, exclude "Rap, Metal, Melisma, Runs".
        
        Return valid JSON.`;

    try {
        if (settings.provider === AIProvider.ZHIPU) {
            const zhipuPrompt = fullPrompt + `\n\nStructure your response EXACTLY as this JSON:
            {
              "title": "string",
              "stylePrompts": "string",
              "negativePrompts": "string",
              "lyrics": "string starting with [Intro]",
              "suggestedSettings": { "weirdness": number, "styleInfluence": number, "vocalGender": "Male"|"Female" }
            }`;
            
            const text = await callZhipuAPI(settings.zhipuKey, [{ role: "user", content: zhipuPrompt }], true, GENERATION_SYSTEM_INSTRUCTION);
            const data = JSON.parse(text) as GeneratedSong;
            if (!data.lyrics.trim().toLowerCase().startsWith("[intro]")) {
                 data.lyrics = "[Intro]\n(Atmospheric build up)\n\n" + data.lyrics;
            }
            return data;
        } else {
            const ai = getGeminiClient(settings.geminiKey);
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
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
                 if (!data.lyrics.trim().toLowerCase().startsWith("[intro]")) {
                     data.lyrics = "[Intro]\n(Atmospheric build up)\n\n" + data.lyrics;
                 }
                 return data;
            }
            throw new Error("No response text");
        }
    } catch (error) {
        console.error("Generation failed", error);
        throw error;
    }
}

export const generateSongAssets = async (title: string, lyrics: string, style: string, settings: AISettings): Promise<SongAssets> => {
    const prompt = `Song Title: ${title}\nStyle: ${style}\nLyrics: ${lyrics.substring(0, 500)}...`;

    try {
        if (settings.provider === AIProvider.ZHIPU) {
             const zhipuPrompt = prompt + `\nReturn JSON: { "caption": "string", "stylizedTitle": "string" }`;
             const text = await callZhipuAPI(settings.zhipuKey, [{ role: "user", content: zhipuPrompt }], true, ASSET_GENERATION_SYSTEM_INSTRUCTION);
             return JSON.parse(text);
        } else {
            const ai = getGeminiClient(settings.geminiKey);
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    systemInstruction: ASSET_GENERATION_SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                    responseSchema: assetsSchema,
                    temperature: 0.8
                }
            });

            if (response.text) return JSON.parse(response.text) as SongAssets;
            return { caption: "Check out my new song!", stylizedTitle: title };
        }
    } catch (error) {
        console.error("Asset generation failed", error);
        throw error;
    }
}

export const generateCoverImage = async (title: string, lyrics: string, settings: AISettings): Promise<string> => {
    try {
        // Note: GLM-4.6 provided text does not specify Image Generation endpoints (CogView).
        // We will require Gemini Key for Image Generation or fallback.
        let ai;
        if (settings.geminiKey) {
            ai = getGeminiClient(settings.geminiKey);
        } else if (settings.provider === AIProvider.GEMINI) {
             // If provider is Gemini but no key (should be caught earlier), try anyway
             ai = getGeminiClient(settings.geminiKey);
        } else {
            throw new Error("Image generation currently requires a Google Gemini API Key. Please add one in settings.");
        }
        
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