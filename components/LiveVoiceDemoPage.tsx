
import React, { useState, useRef, useEffect } from 'react';
import { AgentService, type OrchestratorDecision } from '../services/agentService';
import { MicrophoneIcon, ShieldCheckIcon, ShieldAlertIcon, ActivityIcon, PhoneIcon, UserIcon, CheckCircleIcon, DocumentTextIcon } from './Icons';
import type { CompanyProfile, User, PolicyDocument, GRCAgentRole } from '../types';

interface LiveVoiceDemoPageProps {
    company: CompanyProfile;
    users: User[];
    documents: PolicyDocument[];
    assessments: any;
}

export const LiveVoiceDemoPage: React.FC<LiveVoiceDemoPageProps> = ({ company, users, documents, assessments }) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'meeting' | 'speaking'>('idle');
    const [transcript, setTranscript] = useState('');
    const [decision, setDecision] = useState<OrchestratorDecision | null>(null);
    const [prevMOM, setPrevMOM] = useState<any>(null);
    const [logs, setLogs] = useState<{ id: string; msg: string; type: 'system' | 'agent' | 'human' }[]>([]);
    const [activeSpeaker, setActiveSpeaker] = useState<{ name: string; role: string } | null>(null);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    const recognitionRef = useRef<any>(null);
    const meetingSessionIdRef = useRef<number>(0);

    // Sync voices natively
    useEffect(() => {
        const loadVoices = () => {
            if ('speechSynthesis' in window) {
                setAvailableVoices(window.speechSynthesis.getVoices());
            }
        };
        loadVoices();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            
            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                handleProcessRequest(text);
            };

            recognitionRef.current.onend = () => {
                if (status === 'listening') setStatus('idle');
            };
        }
    }, [status]);

    const addLog = (msg: string, type: 'system' | 'agent' | 'human' = 'system') => {
        setLogs(prev => [{ id: Date.now().toString(), msg, type }, ...prev].slice(0, 50));
    };

    const startListening = () => {
        meetingSessionIdRef.current += 1;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setTranscript('');
        setDecision(null);
        setLogs([]);
        if (recognitionRef.current) {
            recognitionRef.current.start();
            setStatus('listening');
            addLog("User speaking - Listening...", 'human');
        }
    };

    const handleProcessRequest = async (text: string) => {
        meetingSessionIdRef.current += 1;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setStatus('processing');
        addLog(`Voice Processing: "${text}"`, 'human');
        addLog("Activating GRC Orchestrator... Connecting stakeholders.", 'system');
        
        try {
            const result = await AgentService.conductMeeting(text, {
                company,
                users,
                assessments,
                documents,
                prevMOM: prevMOM
            });
            
            setDecision(result);
            if (result.mom) setPrevMOM(result.mom);
            runMeetingVoices(result);
        } catch (error) {
            addLog("Error in multi-agent orchestration.", 'system');
            setStatus('idle');
        }
    };

    const runMeetingVoices = async (result: OrchestratorDecision) => {
        setStatus('meeting');
        addLog("Meeting in progress in the GRC Boardroom.", 'system');
        const currentSessionId = ++meetingSessionIdRef.current;

        // Play each agent's part sequentially
        for (const trace of result.agentTrace) {
            if (meetingSessionIdRef.current !== currentSessionId) {
                console.log("GRC Boardroom Interrupted - terminating speech thread.");
                break;
            }
            setActiveSpeaker({ name: trace.speakerName, role: trace.agentRole });
            addLog(`${trace.speakerName} (${trace.agentRole}): ${trace.reasoning}`, 'agent');
            await speak(trace.reasoning, trace.agentRole, currentSessionId);
        }

        // Final Orchestrator summary
        if (meetingSessionIdRef.current === currentSessionId) {
            setActiveSpeaker({ name: 'Orchestrator', role: 'Orchestrator' });
            addLog(`Orchestrator: ${result.summary}`, 'agent');
            await speak(result.summary, 'Orchestrator', currentSessionId);
        }

        if (meetingSessionIdRef.current === currentSessionId) {
            setActiveSpeaker(null);
            setStatus('idle');
        }
    };

    const speak = (text: string, role: string, sessionId: number) => {
        return new Promise<void>((resolve) => {
            if (!('speechSynthesis' in window) || meetingSessionIdRef.current !== sessionId) {
                resolve();
                return;
            }

            // Always clear previous voice queue first to avoid talking lag
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            const voicesList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

            const getBestMaleVoice = () => {
                const preferredKeywords = [
                    'google us english male',
                    'natural male',
                    'premium male',
                    'guy',
                    'david',
                    'mark',
                    'george',
                    'richard',
                    'andrew',
                    'microsoft david',
                    'male'
                ];
                for (const keyword of preferredKeywords) {
                    const voice = voicesList.find(v => v.name.toLowerCase().includes(keyword) && v.lang.toLowerCase().startsWith('en'));
                    if (voice) return voice;
                }
                const anyMale = voicesList.find(v => (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('guy')) && v.lang.toLowerCase().startsWith('en'));
                if (anyMale) return anyMale;
                return voicesList.find(v => v.lang.toLowerCase().startsWith('en'));
            };

            const selectedVoice = getBestMaleVoice();
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            
            // Assign different characteristics based on role
            switch (role) {
                case 'CISO': utterance.pitch = 0.82; utterance.rate = 0.88; break;
                case 'CIO': utterance.pitch = 1.0; utterance.rate = 0.92; break;
                case 'DPO': utterance.pitch = 1.02; utterance.rate = 0.96; break;
                case 'Auditor': utterance.pitch = 0.88; utterance.rate = 0.94; break;
                case 'Compliance Officer': utterance.pitch = 0.96; utterance.rate = 0.94; break;
                default: utterance.pitch = 0.95; utterance.rate = 0.95;
            }

            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-normal text-gray-800 dark:text-gray-100 uppercase tracking-widest">GRC Executive Boardroom</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Live multi-agent collaboration and compliance decision engine.</p>
                </div>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-normal text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded border border-green-100 dark:border-green-900/50">
                        <ActivityIcon className="w-3 h-3" /> LIVE STATUS: {status.toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-normal text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded border border-teal-100 dark:border-teal-900/50 uppercase">
                        Framework: {assessments?.selectedFramework || 'None'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Boardroom Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 min-h-[400px] flex flex-col relative overflow-hidden">
                        {/* The Table */}
                        <div className="absolute inset-0 bg-gradient-to-b from-teal-50/50 to-transparent dark:from-teal-900/10 pointer-events-none" />
                        
                        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                            {['CISO', 'CIO', 'DPO', 'Auditor', 'Compliance', 'CEO', 'CTO', 'Cybersecurity Officer'].map((role) => {
                                const isSpeaking = activeSpeaker?.role === role || (role === 'CEO' && status === 'listening');
                                return (
                                    <div key={role} className={`flex flex-col items-center transition-all duration-300 ${isSpeaking ? 'scale-110' : 'opacity-60 scale-90'}`}>
                                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-1 shadow-inner relative ${
                                            isSpeaking ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                                        }`}>
                                            <UserIcon className={`w-6 h-6 ${isSpeaking ? 'text-teal-600' : 'text-gray-400'}`} />
                                            {isSpeaking && <div className="absolute inset-0 rounded-full border-4 border-teal-500 animate-ping opacity-20" />}
                                        </div>
                                        <p className={`text-[8px] font-normal uppercase tracking-tighter text-center leading-tight ${isSpeaking ? 'text-teal-600' : 'text-gray-500'}`}>{role}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Central Interaction */}
                        <div className="flex-1 flex flex-col items-center justify-center mt-auto">
                            <div className={`relative p-8 rounded-full transition-all duration-700 ${status === 'listening' ? 'bg-red-50' : status === 'processing' ? 'bg-teal-50' : 'bg-transparent'}`}>
                                <button
                                    onClick={startListening}
                                    disabled={status !== 'idle'}
                                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl overflow-hidden group ${
                                        status === 'idle' ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-gray-100 text-gray-400 scale-95'
                                    }`}
                                >
                                    <MicrophoneIcon className={`w-10 h-10 mb-1 ${status === 'listening' ? 'animate-pulse text-red-500' : ''}`} />
                                    <span className="text-[8px] font-normal uppercase tracking-widest">{status === 'idle' ? 'Speak' : status}</span>
                                    {status === 'processing' && (
                                        <div className="absolute inset-0 bg-teal-500/20 backdrop-blur-sm flex items-center justify-center">
                                            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </button>
                            </div>
                            
                            <div className="mt-8 max-w-md w-full text-center">
                                {transcript && <p className="text-sm italic text-gray-600 dark:text-gray-400 mb-2">"{transcript}"</p>}
                                {activeSpeaker && (
                                    <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-800 animate-slide-up">
                                         <p className="text-[10px] font-normal text-teal-600 mb-1 uppercase">{activeSpeaker.role}: {activeSpeaker.name}</p>
                                         <p className="text-gray-800 dark:text-gray-200 text-sm">{logs[0]?.msg}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Transcript & NFAs */}
                <div className="space-y-6">
                    {/* Live Transcript */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 h-[250px] overflow-hidden flex flex-col">
                        <h4 className="text-[10px] font-normal uppercase text-gray-500 mb-4 flex items-center gap-2">
                             <ActivityIcon className="w-4 h-4 text-teal-400" />
                             Boardroom Transcript
                        </h4>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                            {logs.map((log) => (
                                <div key={log.id} className={`flex flex-col gap-1 border-b border-gray-800/50 pb-2 ${log.type === 'human' ? 'items-end' : 'items-start'}`}>
                                    <span className={`text-[8px] font-normal uppercase ${log.type === 'human' ? 'text-blue-400' : log.type === 'agent' ? 'text-teal-400' : 'text-gray-500'}`}>
                                        {log.type.toUpperCase()}
                                    </span>
                                    <p className={`text-[11px] leading-relaxed ${log.type === 'human' ? 'text-blue-100 text-right' : 'text-gray-300'}`}>
                                        {log.msg}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Results / NFA */}
                    {decision && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 space-y-6 animate-slide-up">
                            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                <span className={`text-[9px] font-normal uppercase px-2 py-1 rounded ${
                                    decision.complianceStatus === 'compliant' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {decision.complianceStatus}
                                </span>
                                <span className="text-[9px] font-normal uppercase text-gray-500">Risk: {decision.riskLevel}</span>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-normal uppercase text-teal-600 flex items-center gap-2">
                                     <DocumentTextIcon className="w-4 h-4" />
                                     Meeting Minutes (MOM)
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {decision.mom?.discussionPoints.map((point, i) => (
                                        <p key={i} className="text-[11px] text-gray-600 dark:text-gray-400 border-l border-teal-100 pl-2">
                                            {point}
                                        </p>
                                    ))}
                                </div>
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-[10px] font-normal text-red-500 uppercase mb-2">Risks Identified</p>
                                    <div className="flex flex-wrap gap-1">
                                        {decision.mom?.identifiedRisks.map((risk, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-normal border border-red-100">
                                                {risk.title} ({risk.level})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-normal uppercase text-orange-500 flex items-center gap-2">
                                     <ShieldAlertIcon className="w-4 h-4" />
                                     Executive Directives (NFA)
                                </h4>
                                <div className="space-y-2">
                                    {decision.nfa.map((nfa, i) => (
                                        <div key={i} className="flex items-start gap-2 p-2 bg-orange-50/50 dark:bg-orange-900/10 rounded border border-orange-100/50 dark:border-orange-900/30">
                                            <CheckCircleIcon className="w-3 h-3 text-orange-500 mt-0.5" />
                                            <div>
                                                <p className="text-[11px] text-gray-800 dark:text-gray-200">{nfa.action}</p>
                                                <p className="text-[9px] text-gray-400 uppercase font-normal">{nfa.priority} priority</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
