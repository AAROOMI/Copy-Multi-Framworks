
import { GoogleGenAI, Type } from "@google/genai";
import { LocalLLM } from "./localLLM";

export enum AIMessageRole {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system'
}

export interface AIMessage {
    role: AIMessageRole;
    content: string;
}

export class AIService {
    private static ai: GoogleGenAI | null = null;

    static getAI() {
        if (!this.ai) {
            const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY;
            this.ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
        }
        return this.ai;
    }

    static async generateContent(prompt: string, options: { model?: string; schema?: any; systemInstruction?: string; image?: { data: string; mimeType: string } } = {}): Promise<string> {
        if (!window.navigator.onLine) {
            console.log("Device is offline. Using Local LLM.");
            return await LocalLLM.generateResponse(prompt);
        }

        try {
            const ai = this.getAI();
            const contents: any[] = [];
            if (options.image) {
                contents.push({ inlineData: options.image });
            }
            contents.push({ text: prompt });

            const response = await ai.models.generateContent({
                model: options.model || "gemini-3-flash-preview",
                contents: contents,
                config: {
                    systemInstruction: options.systemInstruction
                }
            });
            
            return response.text || "";
        } catch (error) {
            console.error("Gemini API Error, falling back to Local LLM:", error);
            return await LocalLLM.generateResponse(prompt);
        }
    }

    private static extractJson(text: string): string {
        try {
            const codeBlockMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
            if (codeBlockMatch) return codeBlockMatch[1].trim();
            const generalMatch = text.match(/\{[\s\S]*\}/);
            if (generalMatch) return generalMatch[0].trim();
            return text.trim();
        } catch (e) {
            return text.trim();
        }
    }

    static async generateStructuredContent<T>(prompt: string, schema: any, modelName: string = "gemini-3-flash-preview", systemInstruction?: string): Promise<T> {
        console.log(`Starting structured generation with model: ${modelName}`);
        
        if (!window.navigator.onLine) {
            const response = await LocalLLM.generateResponse(prompt);
            try {
                // If it's a decision request, provide a structured offline response
                if (prompt.includes("Aggregate") || prompt.includes("Orchestrator")) {
                    return {
                        summary: "The system is currently OFFLINE. Multi-agent coordination is simulated in local mode. Please restore connection for full GRC team activation.",
                        riskLevel: "medium",
                        complianceStatus: "undetermined",
                        nfa: [{ action: "Restore internet connection for full GRC team activation", priority: "high", status: "open" }],
                        agentTrace: [{ agentRole: "Offline Controller", reasoning: "Directing to local cache due to lack of connectivity." }]
                    } as any;
                }
                return JSON.parse(this.extractJson(response));
            } catch {
                return {} as T;
            }
        }

        try {
            let formattedSchema = schema;
            if (schema && !schema.type && typeof schema === 'object') {
                formattedSchema = {
                    type: Type.OBJECT,
                    properties: Object.keys(schema).reduce((acc: any, key) => {
                        acc[key] = { 
                            type: Type.STRING,
                            description: `The ${key} content in markdown format`
                        };
                        return acc;
                    }, {}),
                    required: Object.keys(schema)
                };
            }

            const ai = this.getAI();
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: formattedSchema
                }
            });
            
            const extracted = this.extractJson(response.text || "{}");
            return JSON.parse(extracted) as T;
        } catch (error) {
            console.error("Structured AI Error, attempting fallback:", error);
            const fallbackPrompt = `${prompt}\n\nIMPORTANT: Respond with ONLY a valid JSON object matching this structure: ${JSON.stringify(schema)}. Do not include any commentary.`;
            try {
                const fallbackRes = await this.generateContent(fallbackPrompt, { model: modelName });
                const extracted = this.extractJson(fallbackRes);
                return JSON.parse(extracted) as T;
            } catch (e) {
                console.error("Critical: All AI generation attempts failed", e);
                return Object.keys(schema).reduce((acc: any, key) => {
                    acc[key] = "Content generation failed.";
                    return acc;
                }, {}) as T;
            }
        }
    }

    static startChat(options: { model?: string, history?: any[], systemInstruction?: string, tools?: any[] } = {}) {
        const ai = this.getAI();
        return ai.chats.create({
            model: options.model || "gemini-3-flash-preview",
            config: {
                systemInstruction: options.systemInstruction,
                tools: options.tools
            },
            history: options.history
        });
    }
}
