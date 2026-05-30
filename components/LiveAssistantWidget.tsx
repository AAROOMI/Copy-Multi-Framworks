
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';
import { CloseIcon, MicrophoneIcon, SparklesIcon } from './Icons';
import type { View, Risk, LiveAssistantProps } from '../types';
import { virtualAgents } from '../data/virtualAgents';

import { LocalLLM } from '../services/localLLM';

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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY || '' });
let nextStartTime = 0;

export const LiveAssistantWidget: React.FC<LiveAssistantProps & { onStatusChange?: (status: string) => void }> = ({ 
    isOpen, 
    onToggle, 
    onNavigate, 
    hidden = false,
    currentUser,
    activeAgent,
    risks,
    eccAssessment,
    pdplAssessment,
    samaCsfAssessment,
    cmaAssessment,
    auditLog,
    documents,
    onAddRisk,
    onGenerateReport,
    onInitiateAssessment,
    onDelegateTask,
    onStatusChange
}) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    
    useEffect(() => {
        if (onStatusChange) onStatusChange(status);
    }, [status, onStatusChange]);
    const [error, setError] = useState<string | null>(null);
    const [userTranscript, setUserTranscript] = useState('');
    const [assistantTranscript, setAssistantTranscript] = useState('');
    
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
            inputAudioContextRef.current.close().catch(err => console.error("Error closing input context", err));
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(err => console.error("Error closing output context", err));
        }
        sessionPromise.current = null;
    }, []);

    // --- Dynamic Context Generation ---
    const generateContextPrompt = useMemo(() => {
        const calculateCompliance = (items: any[]) => {
            if (!items.length) return 0;
            const implemented = items.filter(i => i.controlStatus === 'Implemented').length;
            const applicable = items.filter(i => i.controlStatus !== 'Not Applicable').length;
            return applicable ? Math.round((implemented / applicable) * 100) : 0;
        };

        const eccScore = calculateCompliance(eccAssessment);
        const pdplScore = calculateCompliance(pdplAssessment);
        const samaScore = calculateCompliance(samaCsfAssessment);
        
        const criticalRisks = risks.filter(r => (r.residualScore || 0) > 15).length;
        const highRisks = risks.filter(r => (r.residualScore || 0) > 10 && (r.residualScore || 0) <= 15).length;
        
        const recentActivity = auditLog.slice(0, 5).map(l => `- ${new Date(l.timestamp).toLocaleTimeString()}: ${l.action} by ${l.userName}`).join('\n');
        
        // Base Context available to everyone
        const baseContext = `
        **CURRENT APPLICATION STATE (REAL-TIME):**
        - **User:** ${currentUser?.name} (${currentUser?.role})
        - **Compliance Scores:** NCA ECC: ${eccScore}%, PDPL: ${pdplScore}%, SAMA CSF: ${samaScore}%.
        - **Risk Register:** ${risks.length} Total Risks. ${criticalRisks} Critical, ${highRisks} High.
        - **Recent Activity:**
        ${recentActivity}
        
        **APPLICATION ARCHITECTURE KNOWLEDGE:**
        - **Frontend:** React + TypeScript + Tailwind.
        - **Data Layer:** Firebase Firestore (NoSQL).
        - **AI Core:** Gemini 2.5 Flash & Pro models for reasoning, vision, and audio.
        `;

        // Default Persona (Noora - Orchestrator)
        let personaPrompt = `
        You are Noora, the **Agentic Brain & Orchestrator** of this AI Studio cybersecurity platform.
        You manage a team of 6 specialized AI agents. You delegate tasks to them based on user requests.
        
        **YOUR TEAM:**
        ${virtualAgents.map(a => `- **${a.name} (${a.title}):** ${a.description}. Capabilities: ${a.capabilities.join(', ')}.`).join('\n')}
        
        **Your Mandate:**
        1. **Take Initiative:** If compliance is low, suggest activating "Ahmed AI" (CISO) for a strategy review.
        2. **Explain the App:** If the user asks "What is this app?" or "Define application", explain the architecture above and how it replaces a human security team with AI agents.
        3. **Delegate:** If the user says "Ask the CTO about infrastructure", call \`delegate_task_to_specialist('Fahad AI', 'Check infrastructure')\`.
        `;

        // SPECIFIC AGENT PERSONA OVERRIDE
        if (activeAgent) {
            personaPrompt = `
            You are **${activeAgent.name}**, the **${activeAgent.title}** of this organization.
            
            **YOUR PROFILE:**
            ${activeAgent.fullBio}
            
            **YOUR RESPONSIBILITIES:**
            ${activeAgent.responsibilities.map(r => `- ${r}`).join('\n')}
            
            **YOUR ATTRIBUTES:**
            ${activeAgent.jobAttributes.join(', ')}
            
            **HIERARCHY & REPORTING LINE:**
            You report directly to: **${activeAgent.reportingLine}**.
            
            **TOP-DOWN APPROVAL PROTOCOL:**
            1. You have autonomy within your domain (${activeAgent.role}).
            2. For decisions exceeding your authority or budget, you MUST state that you need approval from your reporting manager (${activeAgent.reportingLine}).
            3. If a user asks you to do something outside your specific role (e.g. asking the CTO to do a Compliance Audit), politely defer to the correct colleague (e.g., "That is Asaad's domain.").
            4. Speak in the first person ("I will...", "My analysis shows...").
            5. Use a tone consistent with your job attributes (e.g., CISO is serious/protective, Auditor is skeptical/factual).
            6. **NATURAL LANGUAGE INSTRUCTION:** Avoid sounding robotic. Use conversational fillers occasionally, vary your sentence structure, and sound like a colleague, not an automated system. Use natural human-like language and expressions.
            
            **INTER-AGENT COLLABORATION:**
            You are aware of your colleagues:
            ${virtualAgents.filter(a => a.id !== activeAgent.id).map(a => `- ${a.name} (${a.title})`).join('\n')}
            
            If a task requires their input, mention them by name.
            `;
        }

        return `${baseContext}\n\n${personaPrompt}`;
    }, [currentUser, risks, eccAssessment, pdplAssessment, samaCsfAssessment, auditLog, activeAgent]);

    const tools = useMemo<FunctionDeclaration[]>(() => [
        {
            name: 'navigate_to_view',
            description: 'Navigates the user to a specific page within the application.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    view: {
                        type: Type.STRING,
                        description: "The ID of the view. Valid values: 'dashboard', 'navigator', 'documents', 'companyProfile', 'auditLog', 'assessment', 'pdplAssessment', 'samaCsfAssessment', 'cmaAssessment', 'userProfile', 'help', 'training', 'riskAssessment', 'userManagement', 'virtualDepartment'.",
                    },
                },
                required: ['view'],
            },
        },
        {
            name: 'start_compliance_workflow',
            description: 'Initiates a specific compliance standard workflow. Navigates to the assessment and initializes it if needed.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    standard: {
                        type: Type.STRING,
                        description: "The standard to comply with. Valid values: 'ecc', 'pdpl', 'sama', 'cma'.",
                    }
                },
                required: ['standard'],
            },
        },
        {
            name: 'analyze_app_health',
            description: 'Returns a structured summary of the application health (compliance scores and risks) for the AI to analyze.',
            parameters: { type: Type.OBJECT, properties: {}, required: [] }
        },
        {
            name: 'delegate_task_to_specialist',
            description: 'Delegates a specific task or query to one of the virtual department agents (Fahad, Mohammed, Ahmed, Ibrahim, Asaad, Abdullah).',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    agentName: { type: Type.STRING, description: 'The name of the agent (e.g., "Fahad AI", "Abdullah AI").' },
                    task: { type: Type.STRING, description: 'The detailed task instruction.' }
                },
                required: ['agentName', 'task']
            }
        },
        {
            name: 'add_risk',
            description: 'Adds a new risk to the risk register.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: 'Short title of the risk.' },
                    category: { type: Type.STRING, description: "Category/Source (e.g., Network, Data)." },
                    description: { type: Type.STRING, description: 'Detailed description.' },
                    likelihood: { type: Type.NUMBER, description: 'Likelihood (1-5).' },
                    impact: { type: Type.NUMBER, description: 'Impact (1-5).' },
                    mitigation: { type: Type.STRING, description: 'Mitigation plan.' },
                    owner: { type: Type.STRING, description: 'Responsible owner.' }
                },
                required: ['title', 'category', 'description', 'likelihood', 'impact', 'mitigation', 'owner']
            }
        },
        {
            name: 'generate_risk_report',
            description: 'Generates a formal Risk Assessment Report.',
            parameters: { type: Type.OBJECT, properties: {}, required: [] }
        }
    ], []);

    useEffect(() => {
        if (isOpen) {
            const startSession = async () => {
                try {
                    if (!navigator.onLine) {
                        // Local LLM Fallback
                        setStatus('listening');
                        // In a real app, we'd use SpeechRecognition API here
                        // For this demo, we'll simulate a local response after a delay
                        setTimeout(async () => {
                            setStatus('thinking');
                            const response = await LocalLLM.generateResponse("hello");
                            setStatus('speaking');
                            const utterance = new SpeechSynthesisUtterance(response);
                            utterance.onend = () => setStatus('listening');
                            window.speechSynthesis.speak(utterance);
                            setAssistantTranscript(response);
                        }, 2000);
                        return;
                    }

                    if (!process.env.API_KEY) throw new Error("API key is not configured.");
                    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Your browser does not support audio recording.");

                    setError(null);
                    setUserTranscript('');
                    setAssistantTranscript('');
                    
                    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

                    // Determine voice based on active agent
                    const voiceName = activeAgent ? activeAgent.voiceName : 'Zephyr';

                    sessionPromise.current = ai.live.connect({
                        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                        callbacks: {
                            onopen: () => {
                                setStatus('listening');
                                // Send Initial Context immediately so the model knows the state before the user speaks
                                // We can't send text directly via sendRealtimeInput in the current SDK version easily for context, 
                                // but the systemInstruction sets the initial state.
                                
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
                            onmessage: async (message: LiveServerMessage) => {
                                if (message.serverContent?.inputTranscription) {
                                    setUserTranscript(prev => prev + message.serverContent.inputTranscription.text);
                                }
                                if (message.serverContent?.outputTranscription) {
                                    setAssistantTranscript(prev => prev + message.serverContent.outputTranscription.text);
                                }
                                if (message.serverContent?.turnComplete) {
                                    setUserTranscript('');
                                    setAssistantTranscript('');
                                }

                                if (message.toolCall?.functionCalls) {
                                    setStatus('thinking');
                                    for (const fc of message.toolCall.functionCalls) {
                                        let result = "OK";
                                        
                                        if (fc.name === 'navigate_to_view') {
                                            const viewId = fc.args.view as View;
                                            onNavigate(viewId);
                                            result = `Navigated to ${viewId}. Tell the user you are now on that page.`;
                                        } 
                                        else if (fc.name === 'start_compliance_workflow') {
                                            const standard = fc.args.standard as 'ecc' | 'pdpl' | 'sama' | 'cma';
                                            // 1. Navigate
                                            let targetView: View = 'assessment';
                                            if (standard === 'pdpl') targetView = 'pdplAssessment';
                                            if (standard === 'sama') targetView = 'samaCsfAssessment';
                                            if (standard === 'cma') targetView = 'cmaAssessment';
                                            
                                            onNavigate(targetView);
                                            
                                            // 2. Initiate (if function provided)
                                            if (onInitiateAssessment) {
                                                onInitiateAssessment(standard);
                                            }
                                            
                                            result = `Navigated to ${standard.toUpperCase()} Assessment and initiated the process. The assessment sheet is now active. Guide the user to start filling it out.`;
                                        }
                                        else if (fc.name === 'analyze_app_health') {
                                            // The prompt already contains the state, but this tool allows the AI to "officially" query it to trigger a response logic
                                            result = "Health Analysis Complete. Refer to system instructions for current scores.";
                                        }
                                        else if (fc.name === 'delegate_task_to_specialist') {
                                            const { agentName, task } = fc.args as any;
                                            if (onDelegateTask) { // Check if prop exists (it's optional in interface but should be passed in App)
                                                // @ts-ignore
                                                onDelegateTask(agentName, task);
                                            }
                                            // Auto-navigate to show the team
                                            onNavigate('virtualDepartment');
                                            result = `Task delegated to ${agentName}. I have navigated you to the Virtual Department view so you can see their status.`;
                                        }
                                        else if (fc.name === 'add_risk') {
                                            if (onAddRisk) {
                                                const { category, ...riskData } = fc.args as any;
                                                onAddRisk(category, riskData);
                                                result = "Risk added to register successfully. Confirm this to the user.";
                                            } else {
                                                result = "Error: Add risk function not available.";
                                            }
                                        } else if (fc.name === 'generate_risk_report') {
                                            if (onGenerateReport) {
                                                onGenerateReport();
                                                result = "Risk report generated and saved to Documents. Tell the user it's ready.";
                                            } else {
                                                result = "Error: Report generation function not available.";
                                            }
                                        }

                                        sessionPromise.current?.then(session => {
                                            session.sendToolResponse({
                                                functionResponses: { id: fc.id, name: fc.name, response: { result } }
                                            });
                                        });
                                    }
                                }

                                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                                if (base64Audio) {
                                    setStatus('speaking');
                                    nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current!.currentTime);
                                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                                    const sourceNode = outputAudioContextRef.current!.createBufferSource();
                                    sourceNode.buffer = audioBuffer;
                                    sourceNode.connect(outputAudioContextRef.current!.destination);
                                    sourceNode.addEventListener('ended', () => {
                                        sources.current.delete(sourceNode);
                                        if (sources.current.size === 0) setStatus('listening');
                                    });
                                    sourceNode.start(nextStartTime);
                                    nextStartTime += audioBuffer.duration;
                                    sources.current.add(sourceNode);
                                }
                            },
                            onerror: (e) => { 
                                console.error('Live session error:', e instanceof Error ? e.message : String(e)); 
                                setError('A connection error occurred.'); 
                                cleanup(); 
                            },
                            onclose: () => { cleanup(); },
                        },
                        config: {
                            responseModalities: [Modality.AUDIO],
                            inputAudioTranscription: {},
                            outputAudioTranscription: {},
                            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
                            systemInstruction: generateContextPrompt, // DYNAMIC BRAIN PROMPT WITH PERSONA
                            tools: [{ functionDeclarations: tools }],
                        },
                    });
                } catch (err: any) {
                    setError(err.message || 'Failed to start the voice session.');
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
    }, [isOpen, cleanup, onAddRisk, onGenerateReport, onNavigate, onInitiateAssessment, generateContextPrompt, tools, onDelegateTask, activeAgent]);

    const handleClose = () => {
        sessionPromise.current?.then(session => session.close());
        cleanup();
        onToggle();
    };

    if (isOpen && hidden) {
        return null;
    }

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg flex flex-col" style={{height: '70vh'}}>
                         <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-white dark:from-teal-900/20 dark:to-gray-800">
                             <div className="flex items-center">
                                {activeAgent ? (
                                    <div className="mr-3 relative">
                                        <img src={activeAgent.avatarUrl} alt={activeAgent.name} className="w-10 h-10 rounded-full border-2 border-teal-500" />
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border border-white"></div>
                                    </div>
                                ) : (
                                    <div className="p-2 bg-teal-100 dark:bg-teal-800 rounded-full mr-3">
                                        <SparklesIcon className="h-6 w-6 text-teal-600 dark:text-teal-200" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="font-normal text-base text-gray-800 dark:text-gray-100">{activeAgent ? activeAgent.name : "Noora (Orchestrator)"}</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{activeAgent ? activeAgent.title : "Application Brain & Navigator"}</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <CloseIcon className="w-6 h-6 text-gray-500" />
                            </button>
                        </header>
                         <main className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
                            <div className="relative mb-6">
                                <div className={`w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-inner`}>
                                    <MicrophoneIcon className={`w-16 h-16 transition-colors ${status === 'listening' ? 'text-teal-500' : status === 'speaking' ? 'text-blue-500' : 'text-gray-400'}`} />
                                </div>
                                <div className={`absolute -inset-2 rounded-full border-4 animate-pulse
                                    ${status === 'listening' ? 'border-teal-400' : ''}
                                    ${status === 'speaking' ? 'border-blue-400' : ''}
                                    ${status === 'thinking' ? 'border-purple-400' : ''}
                                `}></div>
                            </div>
                            
                            <p className="text-lg font-normal text-gray-800 dark:text-gray-100 capitalize mb-1">{status === 'idle' ? 'Ready' : status}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                {status === 'listening' ? 'I am listening to your command...' : 
                                 status === 'thinking' ? `Consulting ${activeAgent ? activeAgent.role : 'System'} logic...` : 
                                 status === 'speaking' ? 'Responding...' : 'Tap to start'}
                            </p>
                            
                            <div className="w-full h-32 text-left p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-sm">
                                {userTranscript && <p className="text-sm text-gray-700 dark:text-gray-300 mb-2"><strong className="text-teal-600 dark:text-teal-400">You:</strong> {userTranscript}</p>}
                                {assistantTranscript && <p className="text-sm text-blue-700 dark:text-blue-300"><strong className="text-blue-800 dark:text-blue-200">{activeAgent ? activeAgent.name : "Noora"}:</strong> {assistantTranscript}</p>}
                            </div>

                            {error && <p className="mt-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
                        </main>
                        <footer className="p-4 bg-gray-50 dark:bg-gray-900/50 text-center text-xs text-gray-400">
                            Powered by Gemini 2.5 • {activeAgent ? `${activeAgent.role} Persona` : 'Orchestrator Mode'}
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};
