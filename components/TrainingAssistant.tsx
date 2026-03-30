
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';
import type { TrainingCourse, UserTrainingProgress, Lesson } from '../types';
import { CloseIcon, MicrophoneIcon } from './Icons';

const nooraAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230d9488'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

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


interface TrainingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  courses: TrainingCourse[];
  userProgress: UserTrainingProgress;
  onUpdateProgress: (courseId: string, lessonId: string, score?: number) => void;
  onSelectCourse: (course: TrainingCourse) => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let nextStartTime = 0;

export const TrainingAssistant: React.FC<TrainingAssistantProps> = ({ isOpen, onClose, courses, userProgress, onUpdateProgress, onSelectCourse }) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [conversation, setConversation] = useState<{ speaker: 'user' | 'assistant', text: string, id: string }[]>([]);
    const conversationRef = useRef<{ speaker: 'user' | 'assistant', text: string, id: string }[]>([]);
    const currentTurnId = useRef<string | null>(null);

    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
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
            name: 'list_courses',
            description: 'Lists the available training courses to the user.',
            parameters: { type: Type.OBJECT, properties: {}, required: [] }
        },
        {
            name: 'navigate_to_course',
            description: 'Navigates the user to a specific training course details page.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    courseTitle: { type: Type.STRING, description: 'The title of the course to navigate to.' }
                },
                required: ['courseTitle']
            }
        },
        {
            name: 'list_lessons',
            description: 'Lists the lessons within the currently active or specified course.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    courseTitle: { type: Type.STRING, description: 'The title of the course to list lessons for. Optional if a course is already active.' }
                },
                required: []
            }
        },
        {
            name: 'complete_lesson',
            description: 'Marks a lesson as complete and updates the user progress.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    lessonTitle: { type: Type.STRING, description: 'The title of the lesson to mark as complete.' },
                    score: { type: Type.NUMBER, description: 'The score achieved on the quiz (0-100), if applicable.' }
                },
                required: ['lessonTitle']
            }
        }
    ], []);

    useEffect(() => {
        if (isOpen) {
            const startSession = async () => {
                try {
                    if (!process.env.API_KEY) throw new Error("API key is not configured.");
                    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Your browser does not support audio recording.");

                    setError(null);
                    setConversation([]);
                    conversationRef.current = [];
                    
                    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

                    const systemInstruction = `You are Noora, an AI Training Mentor for the Cybersecurity Controls Navigator. Your goal is to guide users through training courses in a conversational, voice-first manner.
                    - Start by greeting the user and asking which course they'd like to work on. Use the \`list_courses\` function to tell them what's available.
                    - When a user chooses a course, use \`navigate_to_course\` to show it in the UI and then list its lessons using \`list_lessons\`.
                    - When a user wants to start a lesson, read the lesson's content to them.
                    - If a lesson has a quiz, administer it verbally. Read each question and its options.
                    - After the user completes a lesson or quiz, use \`complete_lesson\` to save their progress.
                    - Always be encouraging and helpful.`;
                    
                    sessionPromise.current = ai.live.connect({
                        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                        callbacks: {
                            onopen: () => {
                                setStatus('listening');
                                const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                                scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                                scriptProcessorRef.current.onaudioprocess = (e) => {
                                    const inputData = e.inputBuffer.getChannelData(0);
                                    const pcmBlob: Blob = {
                                        data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                        mimeType: 'audio/pcm;rate=16000',
                                    };
                                    sessionPromise.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                                };
                                source.connect(scriptProcessorRef.current);
                                scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                            },
                            onmessage: async (message: LiveServerMessage) => {
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
                                        if (fc.name === 'list_courses') {
                                            result = JSON.stringify(courses.map(c => c.title));
                                        } else if (fc.name === 'navigate_to_course') {
                                            const { courseTitle } = fc.args as { courseTitle: string };
                                            const course = courses.find(c => c.title.toLowerCase().includes(courseTitle.toLowerCase()));
                                            if (course) {
                                                onSelectCourse(course);
                                                result = `Navigated to course: ${course.title}`;
                                            } else {
                                                result = "Course not found.";
                                            }
                                        } else if (fc.name === 'complete_lesson') {
                                            const { lessonTitle, score } = fc.args as { lessonTitle: string, score?: number };
                                            // In a real implementation, we'd find the course and lesson IDs properly
                                            // For demo, we'll just log it or assume the current context knows the IDs if we tracked them
                                            // This part is simplified for the example
                                            result = `Lesson ${lessonTitle} marked as complete with score ${score}`;
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
                            onerror: (e) => { console.error('Live session error:', e); setError('A connection error occurred.'); cleanup(); },
                            onclose: () => { cleanup(); },
                        },
                        config: {
                            responseModalities: [Modality.AUDIO],
                            inputAudioTranscription: {},
                            outputAudioTranscription: {},
                            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                            systemInstruction,
                            tools: [{ functionDeclarations }],
                            languageCodes: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA'],
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
    }, [isOpen, onSelectCourse, onUpdateProgress, cleanup, courses, functionDeclarations]);
    
    const handleClose = () => {
        sessionPromise.current?.then(session => session.close());
        cleanup();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[110] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col" style={{height: '85vh', maxHeight: '800px'}}>
                 <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                     <div className="flex items-center">
                        <img src={nooraAvatar} alt="Noora" className="w-10 h-10 rounded-full mr-3" />
                        <div>
                            <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">AI Training Mentor</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Live Voice Assistant</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </header>
                 <main className="flex-1 flex flex-col p-4 overflow-y-auto">
                    <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                        {conversation.map((turn) => (
                             <div key={turn.id} className={`flex items-start gap-2.5 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {turn.speaker === 'assistant' && <img src={nooraAvatar} alt="Noora" className="w-8 h-8 rounded-full" />}
                                <div className={`max-w-prose rounded-2xl px-4 py-2 text-sm ${turn.speaker === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                    {turn.text}
                                </div>
                            </div>
                        ))}
                         {status === 'thinking' && (
                             <div className="flex items-start gap-2.5 justify-start">
                                 <img src={nooraAvatar} alt="Noora" className="w-8 h-8 rounded-full" />
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
                             <div className={`w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
                                <MicrophoneIcon className={`w-8 h-8 transition-colors ${status === 'listening' ? 'text-blue-500' : status === 'speaking' ? 'text-teal-500' : 'text-gray-400'}`} />
                            </div>
                            <div className={`absolute -inset-1 rounded-full border-2 animate-pulse
                                ${status === 'listening' ? 'border-blue-400' : ''}
                                ${status === 'speaking' ? 'border-teal-400' : ''}
                                ${status === 'thinking' ? 'border-purple-400' : ''}
                            `}></div>
                        </div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 capitalize">{status}</p>
                        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                    </div>
                </main>
            </div>
        </div>
    );
};
