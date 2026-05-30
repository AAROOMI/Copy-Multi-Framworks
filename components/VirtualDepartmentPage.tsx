
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { AIService } from '../services/aiService';
import { virtualAgents } from '../data/virtualAgents';
import type { OrganizationSize, VirtualAgent, Risk, PolicyDocument, AssessmentItem, AuditAction } from '../types';
import { UserGroupIcon, ShieldCheckIcon, SparklesIcon, MicrophoneIcon, ChatBotIcon, UploadIcon, PaperClipIcon, CloseIcon, DocumentTextIcon, EyeIcon } from './Icons';

interface VirtualDepartmentPageProps {
    onDelegateTask: (agentName: string, task: string) => void;
    onConsultAgent: (agent: VirtualAgent) => void;
    risks?: Risk[];
    documents?: PolicyDocument[];
    eccAssessment?: AssessmentItem[];
    pdplAssessment?: AssessmentItem[];
    onAddDocument?: (doc: PolicyDocument) => void;
    onAddRisk?: (risk: Risk) => void;
    onAddAuditLog?: (action: AuditAction, details: string) => void;
}

const DialogueDialogueEntry = null; // Removing the old ai constant

// Define the simulated dialogue entry
interface DialogueEntry {
    speaker: string;
    message_en: string;
    message_ar: string;
    action?: string; 
    timestamp: number;
    attachment?: { name: string, type: string };
}

// Browser Speech Recognition Types
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export const VirtualDepartmentPage: React.FC<VirtualDepartmentPageProps> = ({ 
    onDelegateTask, 
    onConsultAgent,
    risks = [],
    documents = [],
    eccAssessment = [],
    pdplAssessment = [],
    onAddDocument,
    onAddRisk,
    onAddAuditLog
}) => {
    const [orgSize, setOrgSize] = useState<OrganizationSize>('Mid-Market');
    const [selectedAgent, setSelectedAgent] = useState<VirtualAgent | null>(null);
    const [agentTaskInput, setAgentTaskInput] = useState('');
    
    // Live Collaboration State
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [meetingLog, setMeetingLog] = useState<DialogueEntry[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    
    // Voice & Input State
    const [isMicActive, setIsMicActive] = useState(false);
    const [userSpeechInput, setUserSpeechInput] = useState('');
    const recognitionRef = useRef<any>(null);
    
    // Document Upload for Meeting
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedFile, setUploadedFile] = useState<{name: string, data: string, type: string} | null>(null);
    const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [meetingLog, isThinking]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setUserSpeechInput(transcript);
                setIsMicActive(false);
                // Auto-send user input to simulation
                handleUserSpeak(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsMicActive(false);
            };
            
            recognitionRef.current.onend = () => {
                setIsMicActive(false);
            }
        }
    }, []);

    const toggleMic = () => {
        if (isMicActive) {
            recognitionRef.current?.stop();
            setIsMicActive(false);
        } else {
            recognitionRef.current?.start();
            setIsMicActive(true);
        }
    };

    // Text-to-Speech Helper
    const speakLine = (text: string, speaker: string) => {
        if (!('speechSynthesis' in window)) return;
        
        // Cancel previous speech to avoid overlap
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        
        // Comprehensive natural voice selection
        const getBestVoice = (isMale: boolean) => {
            const preferredKeywords = isMale 
                ? ['Natural', 'Premium', 'Google US English', 'Male', 'Guy', 'David', 'Mark'] 
                : ['Natural', 'Premium', 'Google US English', 'Female', 'Zira', 'Samantha', 'Microsoft Maria'];
            
            for (const keyword of preferredKeywords) {
                const voice = voices.find(v => v.name.includes(keyword) && v.lang.startsWith('en'));
                if (voice) return voice;
            }
            return voices.find(v => v.lang.startsWith('en'));
        };

        let selectedVoice;

        if (speaker.includes("Ahmed") || speaker.includes("Fahad") || speaker.includes("Mohammed")) {
             // Male voices
             selectedVoice = getBestVoice(true);
             utterance.pitch = speaker.includes("Ahmed") ? 0.8 : 1.0; // Deep voice for CISO
             utterance.rate = 0.9; // Slightly slower for authoritative feel
        } else {
             // Female voices
             selectedVoice = getBestVoice(false);
             utterance.pitch = 1.05;
             utterance.rate = 1.0;
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    };

    const handleUserSpeak = async (text: string) => {
        // Add user entry immediately
        const userEntry: DialogueEntry = {
            speaker: "You (User)",
            message_en: text,
            message_ar: "...", // Placeholder or translate if needed
            timestamp: Date.now()
        };
        setMeetingLog(prev => [...prev, userEntry]);
        
        // Trigger agents to respond to this
        await runSimulationTurn(text);
    };

    // --- Simulation Logic ---

    // Optimized JSON extractor
    const extractJson = (text: string) => {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? jsonMatch[0] : text;
    };

    const runSimulationTurn = async (userContext?: string, analysisContext?: string) => {
        setIsThinking(true);
        try {
            // 1. Calculate Context
            const eccCompliance = Math.round((eccAssessment.filter(i => i.controlStatus === 'Implemented').length / (eccAssessment.length || 1)) * 100);
            const criticalRisks = risks.filter(r => (r.residualScore || 0) > 15).length;

            let specificInstruction = "Start the meeting. Discuss the lowest compliance area and assign a task to fix it.";
            
            if (userContext) {
                specificInstruction = `The user just said: "${userContext}". Respond to them directly, answer their question, or address their concern.`;
            }
            
            if (analysisContext) {
                specificInstruction = `A document was just uploaded and analyzed. Context: ${analysisContext}. Discuss this findings, determine if it's a new regulation or evidence, and decide on next steps.`;
            }

            const systemInstruction = `
            You are the "Director" of a virtual cybersecurity department. You control 6 AI agents (Ahmed, Fahad, Mohammed, Ibrahim, Asaad, Abdullah).
            
            **Current State:**
            - NCA ECC Compliance: ${eccCompliance}%
            - Critical Risks: ${criticalRisks}
            
            **Task:**
            Generate a short dialogue (2-4 turns) where the agents discuss the situation or respond to the user.
            
            **Requirements:**
            1. **Bilingual:** For every message, provide 'message_en' (English) and 'message_ar' (Arabic translation).
            2. **Actionable:** If they decide to do something, use the 'action' field.
            3. **Role-Aware:** Ensure Ahmed sounds like a CISO, Fahad like a CTO, etc.
            
            **Output Format:**
            JSON ARRAY of objects:
            [{ "speaker": "Name", "message_en": "...", "message_ar": "...", "action": { "type": "create_doc", "title": "...", "category": "..." } }]
            
            Supported Action Types: "create_doc", "assess_risk".
            `;

            const scriptResponse = await AIService.generateContent(specificInstruction, {
                model: 'gemini-2.0-flash',
                systemInstruction: systemInstruction,
            });

            const script = JSON.parse(extractJson(scriptResponse) || '[]');

            // Process script
            for (const line of script) {
                // Speak the line
                speakLine(line.message_en, line.speaker);
                
                await new Promise(r => setTimeout(r, Math.max(2000, line.message_en.length * 60))); // Wait based on text length
                
                const entry: DialogueEntry = {
                    speaker: line.speaker,
                    message_en: line.message_en,
                    message_ar: line.message_ar,
                    timestamp: Date.now()
                };
                
                // Execute Side Effects
                if (line.action) {
                     if (line.action.type === 'create_doc' || (line.action.title && !line.action.category)) {
                        if (onAddDocument) {
                            const newDoc: PolicyDocument = {
                                id: `doc-sim-${Date.now()}`,
                                controlId: `SIM-${Date.now().toString().slice(-4)}`,
                                domainName: 'Simulated Domain',
                                subdomainTitle: 'Live Collaboration',
                                controlDescription: `Auto-generated: ${line.action.title}`,
                                status: 'Pending CISO Approval',
                                content: { policy: `# ${line.action.title}\n\nGenerated during live meeting.`, procedure: "TBD", guideline: "TBD" },
                                approvalHistory: [],
                                createdAt: Date.now(),
                                updatedAt: Date.now(),
                                generatedBy: 'AI Agent'
                            };
                            onAddDocument(newDoc);
                            entry.action = `Created Document: ${line.action.title}`;
                        }
                    } else if (line.action.type === 'assess_risk' || line.action.category) {
                        if (onAddRisk) {
                            const newRisk: Risk = {
                                id: `risk-sim-${Date.now()}`,
                                title: line.action.title,
                                description: "Identified during live collaboration session.",
                                category: line.action.category || 'General',
                                owner: line.speaker,
                                inherentLikelihood: 3, inherentImpact: 3, inherentScore: 9,
                                existingControl: 'None', controlEffectiveness: 'Ineffective',
                                residualLikelihood: 3, residualImpact: 3, residualScore: 9,
                                likelihood: 3, impact: 3,
                                treatmentOption: 'Mitigate', mitigation: 'Develop control.', responsibility: 'IT',
                                dueDate: '', acceptanceCriteria: '', approvedBy: '', remarks: ''
                            };
                            onAddRisk(newRisk);
                            entry.action = `Logged Risk: ${line.action.title}`;
                        }
                    }
                }

                setMeetingLog(prev => [...prev, entry]);
            }

        } catch (e) {
            console.error("Simulation failed", e);
        } finally {
            setIsThinking(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const base64 = loadEvent.target?.result as string;
                setUploadedFile({
                    name: file.name,
                    data: base64.split(',')[1], // Strip prefix
                    type: file.type
                });
                // Auto-trigger analysis
                analyzeDocument(base64.split(',')[1], file.type);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeDocument = async (base64Data: string, mimeType: string) => {
        setIsAnalyzingDoc(true);
        
        // Add "Upload" entry to chat
        const uploadEntry: DialogueEntry = {
            speaker: "You (User)",
            message_en: "I have uploaded a document for review.",
            message_ar: "لقد قمت بتحميل مستند للمراجعة.",
            timestamp: Date.now(),
            attachment: { name: fileInputRef.current?.files?.[0]?.name || "Document", type: "file" }
        };
        setMeetingLog(prev => [...prev, uploadEntry]);

        try {
            // Use Gemini Vision to analyze
            const prompt = `
            You are the collective intelligence of a GRC Department. 
            Analyze this uploaded document image/pdf.
            
            1. Identify what type of document this is (e.g., New Regulation, Audit Evidence, Policy Draft).
            2. If it is a New Regulation/Framework: Identify key requirements and gaps.
            3. If it is Evidence: Validate if it meets typical security controls (firewall rules, logs, etc.).
            
            Provide a concise summary of the analysis to be fed into the meeting simulation.
            `;

            const analysisResult = await AIService.generateContent(prompt, {
                model: 'gemini-2.0-flash',
                image: { data: base64Data, mimeType: mimeType || 'image/png' }
            });
            
            // Feed this context into the simulation loop
            await runSimulationTurn(undefined, analysisResult);

        } catch (err) {
            console.error("Vision analysis failed", err);
            const errorEntry: DialogueEntry = {
                speaker: "System",
                message_en: "Failed to analyze document. Please ensure it is a valid image or PDF.",
                message_ar: "فشل تحليل المستند.",
                timestamp: Date.now()
            };
            setMeetingLog(prev => [...prev, errorEntry]);
        } finally {
            setIsAnalyzingDoc(false);
            setUploadedFile(null);
        }
    };

    const generateMOM = async () => {
        if (meetingLog.length === 0) return;
        
        const logText = meetingLog.map(entry => `${entry.speaker}: ${entry.message_en} ${entry.action ? `[Action: ${entry.action}]` : ''}`).join('\n');
        
        try {
            const momContent = await AIService.generateContent(`Generate a formal Minutes of Meeting (MOM) document based on this transcript:\n\n${logText}\n\nInclude: Date, Attendees (Agents & User), Key Discussion Points, Decisions Made, and Action Items. Format as Markdown.`);
            
            if (onAddDocument) {
                const momDoc: PolicyDocument = {
                    id: `mom-${Date.now()}`,
                    controlId: `MOM-${new Date().toISOString().slice(0,10)}`,
                    domainName: 'Governance',
                    subdomainTitle: 'Meeting Records',
                    controlDescription: 'Minutes of Meeting - Live Collaboration Session',
                    status: 'Approved',
                    content: {
                        policy: momContent,
                        procedure: "N/A",
                        guideline: "Distributed to Management"
                    },
                    approvalHistory: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    generatedBy: 'AI Agent'
                };
                onAddDocument(momDoc);
                alert("Minutes of Meeting generated and saved to Documents.");
            }
            
            setIsLiveMode(false); // End meeting
            
        } catch (e) {
            console.error("MOM Gen failed", e);
        }
    };

    const handleDelegate = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAgent && agentTaskInput.trim()) {
            onDelegateTask(selectedAgent.name, agentTaskInput);
            setAgentTaskInput('');
            alert(`Task delegated to ${selectedAgent.name}. Check Live Assistant/Noora for updates.`);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-normal text-gray-900 dark:text-white flex items-center gap-2">
                        <UserGroupIcon className="w-6 h-6 text-teal-600" />
                        Virtual GRC & Cybersecurity Department
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Your dedicated AI-powered security team, orchestrated by Noora.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-300">Org Size:</span>
                    <select 
                        value={orgSize} 
                        onChange={(e) => setOrgSize(e.target.value as OrganizationSize)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-teal-500 focus:border-teal-500 block p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    >
                        <option value="Startup">Startup (10-50)</option>
                        <option value="Mid-Market">Mid-Market (100-500)</option>
                        <option value="Enterprise">Enterprise (1000+)</option>
                    </select>
                </div>
            </div>

            {/* LIVE COLLABORATION TOGGLE */}
            <div className="flex justify-end">
                <button
                    onClick={() => {
                        if (isLiveMode) {
                            // If ending, ask to generate MOM
                            if (confirm("End meeting and generate Minutes of Meeting?")) {
                                generateMOM();
                            } else {
                                setIsLiveMode(false);
                            }
                        } else {
                            setIsLiveMode(true);
                            setMeetingLog([]);
                            runSimulationTurn();
                        }
                    }}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-normal shadow-lg transition-all ${
                        isLiveMode 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {isLiveMode ? (
                        <>
                            <span className="h-3 w-3 bg-white rounded-full animate-ping"></span>
                            End & Generate MOM
                        </>
                    ) : (
                        <>
                            <ChatBotIcon className="w-5 h-5" />
                            Start Live Collaboration
                        </>
                    )}
                </button>
            </div>

            {/* LIVE MEETING ROOM VIEW */}
            {isLiveMode && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
                    {/* Discussion Log */}
                    <div className="lg:col-span-3 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 flex flex-col h-[600px]">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl">
                            <h3 className="text-white font-normal flex items-center gap-2">
                                <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                                Strategic Alignment Meeting - Live
                            </h3>
                            <div className="flex items-center gap-3">
                                {isAnalyzingDoc && <span className="text-xs text-purple-400 animate-pulse flex items-center"><EyeIcon className="w-3 h-3 mr-1"/> CNN Analysis Active...</span>}
                                {isThinking && <span className="text-xs text-gray-400 animate-pulse">Agents are thinking...</span>}
                            </div>
                        </div>
                        
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {meetingLog.length === 0 && (
                                <div className="text-center text-gray-500 italic mt-20">Initializing Virtual Agents...</div>
                            )}
                            {meetingLog.map((entry, idx) => {
                                const agent = virtualAgents.find(a => a.name === entry.speaker);
                                const isUser = entry.speaker.startsWith("You");
                                return (
                                    <div key={idx} className={`flex items-start gap-4 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
                                        <div className="flex-shrink-0">
                                            {agent ? (
                                                <img src={agent.avatarUrl} className="w-10 h-10 rounded-full border border-gray-600" alt={entry.speaker} />
                                            ) : isUser ? (
                                                <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-normal">U</div>
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                            )}
                                        </div>
                                        <div className={`flex-grow max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                                            <div className={`flex items-baseline justify-between ${isUser ? 'flex-row-reverse' : ''}`}>
                                                <span className="font-normal text-teal-400 text-sm">{entry.speaker}</span>
                                                <span className="text-xs text-gray-500 mx-2">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div className={`mt-1 p-3 rounded-lg ${isUser ? 'bg-teal-900/50 border border-teal-700' : 'bg-gray-800 border border-gray-700'}`}>
                                                <p className="text-gray-200 text-sm">{entry.message_en}</p>
                                                {entry.message_ar && (
                                                    <p className="text-gray-400 text-xs mt-2 text-right font-arabic border-t border-gray-700 pt-1" dir="rtl">{entry.message_ar}</p>
                                                )}
                                            </div>
                                            {entry.attachment && (
                                                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-800 rounded text-xs text-purple-300">
                                                    <PaperClipIcon className="w-3 h-3" />
                                                    Attached: {entry.attachment.name}
                                                </div>
                                            )}
                                            {entry.action && (
                                                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded text-xs text-green-300">
                                                    <SparklesIcon className="w-3 h-3" />
                                                    {entry.action}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Meeting Controls Footer */}
                        <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl flex justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                {/* Microphone */}
                                <button 
                                    onClick={toggleMic}
                                    className={`p-3 rounded-full transition-all duration-300 ${isMicActive ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    title={isMicActive ? "Mute Microphone" : "Speak to Team"}
                                >
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                                
                                {/* Document Upload */}
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                                    title="Upload Document for Analysis"
                                    disabled={isAnalyzingDoc}
                                >
                                    <UploadIcon className="w-5 h-5" />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,application/pdf"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            <div className="flex-grow text-center text-xs text-gray-500">
                                {isMicActive ? "Listening..." : "Microphone Muted"}
                            </div>

                            <button 
                                onClick={() => runSimulationTurn()} 
                                disabled={isThinking}
                                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded text-sm disabled:opacity-50"
                            >
                                Continue
                            </button>
                        </div>
                    </div>

                    {/* Active Agents Status Sidebar */}
                    <div className="lg:col-span-1 space-y-3 h-[600px] overflow-y-auto pr-2">
                        {virtualAgents.map(agent => {
                            const isSpeaking = meetingLog.length > 0 && meetingLog[meetingLog.length - 1].speaker === agent.name;
                            return (
                                <div key={agent.id} className={`p-3 rounded-lg border transition-all duration-300 ${isSpeaking ? 'bg-teal-900/40 border-teal-500 scale-105 shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-80'}`}>
                                    <div className="flex items-center gap-3">
                                        <img src={agent.avatarUrl} className="w-8 h-8 rounded-full" alt={agent.name} />
                                        <div>
                                            <p className={`text-xs font-normal ${isSpeaking ? 'text-teal-300' : 'text-gray-700 dark:text-gray-300'}`}>{agent.name}</p>
                                            <p className="text-[10px] text-gray-500">{agent.role}</p>
                                        </div>
                                        {isSpeaking && (
                                            <div className="ml-auto flex gap-0.5">
                                                <div className="w-1 h-3 bg-teal-500 animate-bounce"></div>
                                                <div className="w-1 h-3 bg-teal-500 animate-bounce delay-100"></div>
                                                <div className="w-1 h-3 bg-teal-500 animate-bounce delay-200"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Upload Status Card */}
                        {uploadedFile && (
                            <div className="p-3 rounded-lg border border-purple-500 bg-purple-900/20 mt-4">
                                <p className="text-xs font-normal text-purple-300 flex items-center gap-2">
                                    <DocumentTextIcon className="w-3 h-3"/>
                                    Analyzing File
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1 truncate">{uploadedFile.name}</p>
                                <div className="w-full bg-gray-700 h-1 mt-2 rounded overflow-hidden">
                                    <div className="h-full bg-purple-500 animate-progress"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Standard Grid View (Visible when NOT in live mode) */}
            {!isLiveMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {virtualAgents.map(agent => (
                        <div 
                            key={agent.id} 
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all cursor-pointer overflow-hidden flex flex-col h-full ${selectedAgent?.id === agent.id ? 'border-teal-500 ring-2 ring-teal-200 dark:ring-teal-900' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                            onClick={() => setSelectedAgent(agent)}
                        >
                            <div className="p-6 flex-grow">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="relative">
                                        <img src={agent.avatarUrl} alt={agent.name} className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md" />
                                        {agent.id === 'agent-abdullah' && (
                                            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-normal px-1.5 py-0.5 rounded-full animate-pulse border border-white">CNN ACTIVE</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-normal text-base text-gray-900 dark:text-white">{agent.name}</h3>
                                        <p className="text-sm font-normal text-teal-600 dark:text-teal-400">{agent.title}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{agent.description}</p>
                                
                                <div className="space-y-2">
                                    {agent.capabilities.slice(0, 3).map((cap, i) => (
                                        <div key={i} className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                            <ShieldCheckIcon className="w-3 h-3 mr-1.5 text-teal-500" />
                                            {cap}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                <span className="text-xs text-gray-500">Reports to: <span className="font-normal">{agent.reportingLine}</span></span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onConsultAgent(agent);
                                    }}
                                    className="flex items-center gap-1 text-xs font-normal text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                                >
                                    <MicrophoneIcon className="w-3 h-3" />
                                    Consult
                                </button>
                            </div>
                            {agent.currentTask && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/30 px-6 py-2 border-t border-yellow-100 dark:border-yellow-900/50">
                                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-normal truncate">
                                        <span className="animate-pulse mr-2">●</span>
                                        Working on: {agent.currentTask}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {selectedAgent && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                             <img src={selectedAgent.avatarUrl} alt={selectedAgent.name} className="w-20 h-20 rounded-full object-cover border-2 border-teal-500 shadow-md" />
                             <div>
                                <h2 className="text-lg font-normal text-gray-900 dark:text-white">
                                    {selectedAgent.name}
                                </h2>
                                <p className="text-teal-600 dark:text-teal-400 font-normal">{selectedAgent.title}</p>
                                <div className="flex gap-2 mt-2">
                                    {selectedAgent.jobAttributes.map((attr, i) => (
                                        <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                            {attr}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <button
                                onClick={() => onConsultAgent(selectedAgent)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-normal shadow-sm transition-colors"
                             >
                                 <MicrophoneIcon className="w-4 h-4" />
                                 Start Voice Session
                             </button>
                             <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-gray-600 p-2">Close</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-2">Professional Bio</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{selectedAgent.fullBio}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-2">Key Responsibilities</h3>
                                <ul className="space-y-2">
                                    {selectedAgent.responsibilities.map((resp, i) => (
                                        <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                                            <span className="mr-2 text-teal-500">•</span>
                                            {resp}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-normal text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-3">Delegate Task</h3>
                                <form onSubmit={handleDelegate} className="space-y-4">
                                    <div>
                                        <textarea 
                                            className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-teal-500 focus:border-teal-500 text-sm"
                                            placeholder={`Instruct ${selectedAgent.role} to perform a task within their domain...`}
                                            value={agentTaskInput}
                                            onChange={(e) => setAgentTaskInput(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            type="submit" 
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none"
                                            disabled={!agentTaskInput.trim()}
                                        >
                                            <SparklesIcon className="w-4 h-4 mr-2" />
                                            Delegate Task
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        
                        <div className="md:col-span-1 space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-normal text-gray-700 dark:text-gray-200 mb-3">Capabilities</h3>
                                <ul className="space-y-2">
                                    {selectedAgent.capabilities.map((cap, i) => (
                                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                                            <ShieldCheckIcon className="w-3 h-3 mr-2 text-green-500" />
                                            {cap}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {selectedAgent.id === 'agent-abdullah' && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                                    <strong className="block text-blue-700 dark:text-blue-300 mb-1">CNN Feature Embedding</strong>
                                    Analyzing compliance artifacts with 98.5% accuracy for automated categorization.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }
                .animate-progress {
                    animation: progress 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
