
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { AIService } from '../services/aiService';
import { LocalLLM } from '../services/localLLM';
import type { Risk } from '../types';
import { CloseIcon, MicrophoneIcon } from './Icons';
import { virtualAgents } from '../data/virtualAgents';

// Use Rashid's avatar from data if available, otherwise fallback
const rashidAgent = virtualAgents.find(a => a.id === 'agent-rashid');
const rashidAvatar = rashidAgent ? rashidAgent.avatarUrl : "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

// Audio utility functions
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


let nextStartTime = 0;

interface RiskAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    risks: Risk[];
    setRisks: (updater: React.SetStateAction<Risk[]>) => void;
    onInitiate: () => void;
}

export const RiskAssistant: React.FC<RiskAssistantProps> = ({ isOpen, onClose, risks, setRisks, onInitiate }) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [conversation, setConversation] = useState<{ speaker: 'user' | 'assistant', text: string, id: string }[]>([]);
    const conversationRef = useRef(conversation);
    const currentTurnId = useRef<string | null>(null);

    const sessionPromise = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sources = useRef(new Set<AudioBufferSourceNode>());
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const cleanup = useCallback(() => {
        setStatus('idle');
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(console.error);
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
        }
        sessionPromise.current = null;
    }, []);

    const functionDeclarations = useMemo<FunctionDeclaration[]>(() => [
        {
            name: 'add_risk',
            description: 'Adds a new risk to the specified category in the risk register after analyzing it with the user.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING, description: "The category for the new risk. Must be one of: 'Network Security', 'Data Security', 'Endpoint Security', 'Access Control', 'General'." },
                    description: { type: Type.STRING, description: 'A detailed description of the risk scenario.' },
                    title: { type: Type.STRING, description: 'A short, concise title for the risk.' },
                    likelihood: { type: Type.NUMBER, description: 'The inherent likelihood of the risk occurring, from 1 (Rare) to 5 (Almost Certain).' },
                    impact: { type: Type.NUMBER, description: 'The inherent impact if the risk occurs, from 1 (Insignificant) to 5 (Catastrophic).' },
                    mitigation: { type: Type.STRING, description: 'The agreed-upon mitigation strategy/action plan.' },
                    owner: { type: Type.STRING, description: 'The team or individual responsible for the risk.' }
                },
                required: ['category', 'title', 'description', 'likelihood', 'impact', 'mitigation', 'owner']
            }
        },
        {
            name: 'update_risk',
            description: 'Updates an existing risk in the register.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    risk_title_to_find: { type: Type.STRING, description: 'The title of the risk to find.' },
                    updated_fields: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            likelihood: { type: Type.NUMBER },
                            impact: { type: Type.NUMBER },
                            mitigation: { type: Type.STRING },
                            owner: { type: Type.STRING },
                            progress: { type: Type.NUMBER }
                        }
                    }
                },
                required: ['risk_title_to_find', 'updated_fields']
            }
        },
        {
            name: 'delete_risk',
            description: 'Deletes a risk from the register.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    risk_title_to_find: { type: Type.STRING, description: 'The title of the risk to delete.' }
                },
                required: ['risk_title_to_find']
            }
        }
    ], []);

    useEffect(() => {
        if (isOpen) {
            const startSession = async () => {
                try {
                    if (!navigator.onLine) {
                        setStatus('speaking');
                        const response = await LocalLLM.generateResponse("Rashid, start the risk interview.");
                        setConversation([{ speaker: 'assistant', text: response, id: 'offline-intro' }]);
                        setStatus('idle');
                        return;
                    }
                    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Browser does not support audio recording.");
                    setError(null);
                    setConversation([]);
                    conversationRef.current = [];

                    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

                    const riskCategories = "'Network Security', 'Data Security', 'Endpoint Security', 'Access Control', 'General'";
                    const currentRisksSummary = risks.map(r => ` - [${r.title}] ${r.description} (L:${r.likelihood}, I:${r.impact}, Mitigation: ${r.mitigation})`).join('\n');

                    const systemInstruction = `You are **Rashid AI**, the organization's **Enterprise Risk Manager**. 
                    
                    **Your Persona:**
                    - **Voice:** Professional, analytical, calm, and methodical.
                    - **Methodology:** You strictly follow ISO 31000 Risk Management guidelines.
                    - **Goal:** Interview the user to identify risks, assess their inherent severity (Likelihood x Impact), and define treatment plans.
                    
                    **Your Process (The Interview):**
                    1.  **Identification:** Ask the user "What is the risk scenario you are concerned about?" or "Are there any new assets or changes we need to assess?"
                    2.  **Analysis:** When the user describes a risk, ask clarifying questions to determine:
                        - **Inherent Likelihood (1-5):** How probable is this without controls?
                        - **Inherent Impact (1-5):** How bad would the damage be (financial, reputational)?
                    3.  **Treatment:** Ask "What controls do we have in place?" or suggest standard mitigations (e.g., "For this type of risk, I recommend MFA or Encryption").
                    4.  **Registration:** Once you have the *Title, Description, Likelihood, Impact, Mitigation, and Owner*, say "I am registering this risk now" and call the \`add_risk\` tool.

                    **Current Context:**
                    The Risk Register currently contains:
                    ${currentRisksSummary || "The register is empty."}

                    **Capabilities:**
                    - If the user asks about the overall posture, analyze the existing risks.
                    - If the user wants to update a risk, use \`update_risk\`.
                    - Always validate the "Owner" of the risk (e.g., IT Team, HR, CISO).

                    Start by introducing yourself as Rashid, the Risk Manager, and ask if there are any new risks to assess today.`;

                    sessionPromise.current = AIService.getAI().live.connect({
                        model: 'gemini-3.1-flash-live-preview',
                        callbacks: {
                            onopen: () => {
                                setStatus('listening');
                                const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                                scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                                scriptProcessorRef.current.onaudioprocess = (e) => {
                                    const inputData = e.inputBuffer.getChannelData(0);
                                    const pcmData = encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer));
                                    sessionPromise.current?.then(session => session.sendRealtimeInput({ 
                                        audio: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } 
                                    }));
                                };
                                source.connect(scriptProcessorRef.current);
                                scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                            },
                            onmessage: async (message) => {
                               if (message.serverContent?.inputTranscription) {
                                    const text = message.serverContent.inputTranscription.text;
                                    if (!currentTurnId.current || !currentTurnId.current.endsWith('user')) {
                                        currentTurnId.current = `turn-${Date.now()}-user`;
                                        conversationRef.current = [...conversationRef.current, { speaker: 'user', text, id: currentTurnId.current }];
                                    } else {
                                        conversationRef.current = conversationRef.current.map(turn => 
                                            turn.id === currentTurnId.current ? { ...turn, text: turn.text + text } : turn
                                        );
                                    }
                                    setConversation([...conversationRef.current]);
                                }

                                if (message.serverContent?.outputTranscription) {
                                    const text = message.serverContent.outputTranscription.text;
                                    if (!currentTurnId.current || !currentTurnId.current.endsWith('assistant')) {
                                        currentTurnId.current = `turn-${Date.now()}-assistant`;
                                        conversationRef.current = [...conversationRef.current, { speaker: 'assistant', text, id: currentTurnId.current }];
                                    } else {
                                        conversationRef.current = conversationRef.current.map(turn => 
                                            turn.id === currentTurnId.current ? { ...turn, text: turn.text + text } : turn
                                        );
                                    }
                                    setConversation([...conversationRef.current]);
                                }
                                
                                if (message.serverContent?.turnComplete) {
                                    currentTurnId.current = null;
                                }

                               if (message.toolCall?.functionCalls) {
                                    setStatus('thinking');
                                    for (const fc of message.toolCall.functionCalls) {
                                        let result = "OK";
                                        if (fc.name === 'add_risk') {
                                            const args = fc.args as any;
                                            const iScore = args.likelihood * args.impact;
                                            const newRisk = { 
                                                ...args, 
                                                id: `rashid-${Date.now()}`,
                                                inherentLikelihood: args.likelihood,
                                                inherentImpact: args.impact,
                                                inherentScore: iScore,
                                                residualLikelihood: args.likelihood, // Default to inherent until controls assessed
                                                residualImpact: args.impact,
                                                residualScore: iScore,
                                                treatmentOption: 'Mitigate',
                                                controlEffectiveness: 'Needs Improvement',
                                                existingControl: 'None (New Risk)',
                                                progress: 0
                                            };
                                            setRisks(prev => [...prev, newRisk]);
                                            result = `Risk "${args.title}" added to register successfully with Inherent Score ${iScore}.`;
                                        } else if (fc.name === 'update_risk') {
                                            const { risk_title_to_find, updated_fields } = fc.args as any;
                                            setRisks(prev => prev.map(r => r.title?.includes(risk_title_to_find) ? { ...r, ...updated_fields } : r));
                                            result = "Risk updated.";
                                        } else if (fc.name === 'delete_risk') {
                                            const { risk_title_to_find } = fc.args as any;
                                            setRisks(prev => prev.filter(r => !r.title?.includes(risk_title_to_find)));
                                            result = "Risk deleted.";
                                        }
                                        sessionPromise.current?.then(session => session.sendToolResponse({
                                            functionResponses: { id: fc.id, name: fc.name, response: { result } }
                                        }));
                                    }
                                }
                                
                                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                                if (base64Audio) {
                                    setStatus('speaking');
                                    const audioCtx = outputAudioContextRef.current;
                                    if(audioCtx) {
                                        nextStartTime = Math.max(nextStartTime, audioCtx.currentTime);
                                        const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
                                        const sourceNode = audioCtx.createBufferSource();
                                        sourceNode.buffer = audioBuffer;
                                        sourceNode.connect(audioCtx.destination);
                                        sourceNode.addEventListener('ended', () => {
                                            sources.current.delete(sourceNode);
                                            if (sources.current.size === 0) {
                                                setStatus('listening');
                                            }
                                        });
                                        sourceNode.start(nextStartTime);
                                        nextStartTime += audioBuffer.duration;
                                        sources.current.add(sourceNode);
                                    }
                                } else if (status === 'speaking' && sources.current.size === 0) {
                                    setStatus('listening');
                                }

                                if (message.serverContent?.interrupted) {
                                    for (const source of sources.current.values()) {
                                        source.stop();
                                        sources.current.delete(source);
                                    }
                                    nextStartTime = 0;
                                }
                            },
                            onerror: (e) => { console.error('Risk assistant error:', e); setError('Connection error.'); cleanup(); },
                            onclose: () => { cleanup(); },
                        },
                        config: {
                            responseModalities: [Modality.AUDIO],
                            inputAudioTranscription: {},
                            outputAudioTranscription: {},
                            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } }, // Deep voice for Rashid
                            systemInstruction,
                            tools: [{ functionDeclarations }],
                        },
                    });
                } catch (err: any) {
                    setError(err.message || 'Failed to start session.');
                    console.error(err);
                    cleanup();
                }
            };
            startSession();

            return () => {
                sessionPromise.current?.then(session => session.close());
                cleanup();
            };
        }
    }, [isOpen, risks, setRisks, onInitiate, cleanup, functionDeclarations]);

    const handleClose = () => {
        sessionPromise.current?.then(session => session.close());
        cleanup();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[110] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col" style={{height: '85vh', maxHeight: '800px'}}>
                 <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-teal-50 dark:bg-teal-900/20">
                     <div className="flex items-center">
                        <img src={rashidAvatar} alt="Rashid AI" className="w-12 h-12 rounded-full mr-3 border-2 border-teal-600 shadow-sm" />
                        <div>
                            <h2 className="font-normal text-lg text-gray-800 dark:text-gray-100">Rashid AI</h2>
                            <p className="text-xs text-teal-600 dark:text-teal-400 font-normal">Enterprise Risk Manager • ISO 31000</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </header>
                 <main className="flex-1 flex flex-col p-4 overflow-y-auto">
                    <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                        {conversation.length === 0 && (
                            <div className="text-center text-gray-500 mt-10">
                                <p>Connecting to Rashid AI...</p>
                            </div>
                        )}
                        {conversation.map((turn) => (
                             <div key={turn.id} className={`flex items-start gap-2.5 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {turn.speaker === 'assistant' && <img src={rashidAvatar} alt="Rashid" className="w-8 h-8 rounded-full" />}
                                <div className={`max-w-prose rounded-2xl px-4 py-2 text-sm ${turn.speaker === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                    {turn.text}
                                </div>
                            </div>
                        ))}
                         {status === 'thinking' && (
                             <div className="flex items-start gap-2.5 justify-start">
                                 <img src={rashidAvatar} alt="Rashid" className="w-8 h-8 rounded-full" />
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-3 rounded-bl-none">
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-pulse [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-pulse [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                        <div className="relative inline-block mb-2">
                             <div className={`w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-inner`}>
                                <MicrophoneIcon className={`w-8 h-8 transition-colors ${status === 'listening' ? 'text-teal-600' : status === 'speaking' ? 'text-blue-500' : 'text-gray-400'}`} />
                            </div>
                            <div className={`absolute -inset-1 rounded-full border-2 animate-pulse
                                ${status === 'listening' ? 'border-teal-500' : ''}
                                ${status === 'speaking' ? 'border-blue-500' : ''}
                                ${status === 'thinking' ? 'border-purple-500' : ''}
                            `}></div>
                        </div>
                        <p className="text-sm font-normal text-gray-600 dark:text-gray-400 capitalize">{status}</p>
                        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                    </div>
                </main>
            </div>
        </div>
    );
};
