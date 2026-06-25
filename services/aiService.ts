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

// Provider-agnostic interface
export interface AIProvider {
    name: string;
    generateContent(prompt: string, options?: { model?: string; schema?: any; systemInstruction?: string; image?: { data: string; mimeType: string } }): Promise<string>;
    generateStructuredContent<T>(prompt: string, schema: any, modelName?: string, systemInstruction?: string): Promise<T>;
}

// Helper to extract JSON from markdown or text
function extractJson(text: string): string {
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

// Cloud Gemini Provider
export class GeminiProvider implements AIProvider {
    name = 'Google Cloud Gemini';
    private ai: GoogleGenAI | null = null;

    private getAI() {
        if (!this.ai) {
            const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY;
            this.ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
        }
        return this.ai;
    }

    async generateContent(prompt: string, options: { model?: string; schema?: any; systemInstruction?: string; image?: { data: string; mimeType: string } } = {}): Promise<string> {
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
    }

    async generateStructuredContent<T>(prompt: string, schema: any, modelName: string = "gemini-3-flash-preview", systemInstruction?: string): Promise<T> {
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
        
        const extracted = extractJson(response.text || "{}");
        return JSON.parse(extracted) as T;
    }
}

// Local Gemma Provider
export class GemmaLocalProvider implements AIProvider {
    name = 'Google Gemma 4B (Local)';

    async generateContent(prompt: string): Promise<string> {
        console.log("[GemmaLocalProvider] Routing query offline to LocalLLM...");
        return await LocalLLM.generateResponse(prompt);
    }

    async generateStructuredContent<T>(prompt: string, schema: any): Promise<T> {
        console.log("[GemmaLocalProvider] Routing structured query offline to LocalLLM...");
        const response = await LocalLLM.generateResponse(prompt);
        try {
            // Direct mock response matching standard decision structure
            if (prompt.includes("Aggregate") || prompt.includes("Orchestrator")) {
                return {
                    summary: "The system is currently OFFLINE. Multi-agent coordination is simulated in local mode. Please restore connection for full GRC team activation.",
                    riskLevel: "medium",
                    complianceStatus: "undetermined",
                    nfa: [{ action: "Restore internet connection for full GRC team activation", priority: "high", status: "open" }],
                    agentTrace: [{ agentRole: "Offline Controller", reasoning: "Directing to local cache due to lack of connectivity." }]
                } as any;
            }
            return JSON.parse(extractJson(response));
        } catch {
            // Safe fallback structure
            return Object.keys(schema).reduce((acc: any, key) => {
                acc[key] = "Local offline processing complete.";
                return acc;
            }, {}) as T;
        }
    }
}

// Orchestrator Service managing the fallback chain
export class AIService {
    private static primaryProvider: AIProvider = new GeminiProvider();
    private static secondaryProvider: AIProvider = new GemmaLocalProvider();
    private static forceLocalMode = false;
    private static aiInstance: GoogleGenAI | null = null;

    static getAI() {
        if (!this.aiInstance) {
            const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY;
            this.aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
        }
        return this.aiInstance;
    }

    static setForceLocal(force: boolean) {
        this.forceLocalMode = force;
        console.log(`[AIService] Force Local mode updated: ${force}`);
    }

    static getActiveProvider(): AIProvider {
        const isOnline = typeof window !== 'undefined' && window.navigator.onLine;
        if (!isOnline || this.forceLocalMode) {
            return this.secondaryProvider;
        }
        return this.primaryProvider;
    }

    static async generateContent(prompt: string, options: { model?: string; schema?: any; systemInstruction?: string; image?: { data: string; mimeType: string } } = {}): Promise<string> {
        const provider = this.getActiveProvider();
        console.log(`[AIService] Active Provider: ${provider.name}`);

        try {
            return await provider.generateContent(prompt, options);
        } catch (error) {
            console.error(`[AIService] Primary provider ${provider.name} failed, falling back to local Gemma 4B:`, error);
            if (provider !== this.secondaryProvider) {
                return await this.secondaryProvider.generateContent(prompt);
            }
            throw error;
        }
    }

    static async generateStructuredContent<T>(prompt: string, schema: any, modelName: string = "gemini-3-flash-preview", systemInstruction?: string): Promise<T> {
        const provider = this.getActiveProvider();
        console.log(`[AIService] Active Structured Provider: ${provider.name}`);

        try {
            return await provider.generateStructuredContent<T>(prompt, schema, modelName, systemInstruction);
        } catch (error) {
            console.error(`[AIService] Structured AI Error on ${provider.name}, attempting local Gemma 4B fallback:`, error);
            if (provider !== this.secondaryProvider) {
                return await this.secondaryProvider.generateStructuredContent<T>(prompt, schema);
            }
            
            // Critical fail safe
            return Object.keys(schema).reduce((acc: any, key) => {
                acc[key] = "Content generation failed.";
                return acc;
            }, {}) as T;
        }
    }

    static startChat(options: { model?: string, history?: any[], systemInstruction?: string, tools?: any[] } = {}) {
        // Fallback or legacy chats create GoogleGenAI directly
        const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
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
