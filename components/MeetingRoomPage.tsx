
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { virtualAgents } from '../data/virtualAgents';
import { SparklesIcon, PhoneIcon } from './Icons';
import type { VirtualAgent } from '../types';

interface Participant extends VirtualAgent {
    isSpeaking: boolean;
    hasLaptop: boolean;
    hasMic: boolean;
}

export const MeetingRoomPage: React.FC = () => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
    const [meetingMinutes, setMeetingMinutes] = useState<string[]>([]);
    const [isMeetingActive, setIsMeetingActive] = useState(false);

    useEffect(() => {
        // Initialize participants with laptops and mics
        const initial = virtualAgents.map(agent => ({
            ...agent,
            isSpeaking: false,
            hasLaptop: true,
            hasMic: true
        }));
        setParticipants(initial);
    }, []);

    useEffect(() => {
        if (!isMeetingActive) return;

        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * participants.length);
            const speaker = participants[randomIndex];
            setActiveSpeakerId(speaker.id);
            
            // Mock meeting minutes
            const phrases = [
                `${speaker.name} is discussing the quarterly compliance roadmap.`,
                `${speaker.name} raised a point about PDPL data residency requirements.`,
                `${speaker.name} is presenting the latest risk assessment findings.`,
                `${speaker.name} suggests increasing the budget for VAPT tools.`,
                `${speaker.name} is reviewing the new NCA ECC controls implementation.`,
                `${speaker.name} highlights the importance of Zero Trust architecture.`
            ];
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            setMeetingMinutes(prev => [randomPhrase, ...prev].slice(0, 10));

        }, 5000);

        return () => clearInterval(interval);
    }, [isMeetingActive, participants]);

    const handleToggleMeeting = () => {
        setIsMeetingActive(!isMeetingActive);
        if (!isMeetingActive) {
            setMeetingMinutes(["Meeting started. Recording minutes..."]);
        } else {
            setMeetingMinutes(prev => ["Meeting adjourned.", ...prev]);
            setActiveSpeakerId(null);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-normal text-gray-900 dark:text-white tracking-tight">Virtual Board Meeting Room</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal uppercase tracking-wider mt-1">Autonomous GRC Decision-Making Environment</p>
                </div>
                <button 
                    onClick={handleToggleMeeting}
                    className={`px-6 py-2.5 rounded-full text-sm font-normal uppercase tracking-widest transition-all ${
                        isMeetingActive 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' 
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20'
                    }`}
                >
                    {isMeetingActive ? 'Adjourn Meeting' : 'Start Board Meeting'}
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Visual Meeting Room Area */}
                <div className="lg:col-span-2 bg-[#f8fafc] dark:bg-[#0f172a] rounded-3xl p-8 relative overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-800 shadow-inner">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#14b8a6 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                    
                    {/* The Meeting Table */}
                    <div className="relative w-full max-w-2xl aspect-[16/9] bg-white dark:bg-gray-800 rounded-[60px] shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center z-10">
                        {/* Table Top Surface Decor */}
                        <div className="absolute inset-4 border border-gray-100 dark:border-gray-700 rounded-[50px] pointer-events-none"></div>
                        
                        {/* Conference Mic / Speaker Hub in center */}
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center shadow-inner relative">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isMeetingActive ? 'bg-teal-500/20 text-teal-600 animate-pulse' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                               <PhoneIcon className="w-6 h-6" />
                           </div>
                           {isMeetingActive && <div className="absolute inset-0 rounded-full border-2 border-teal-500 animate-ping opacity-25"></div>}
                        </div>

                        {/* Participants Positioning */}
                        {participants.map((participant, index) => {
                            // Circular positioning around the table
                            const angle = (index / participants.length) * 2 * Math.PI - Math.PI / 2;
                            const radiusX = 140; // Horizontal radius
                            const radiusY = 90;  // Vertical radius
                            const x = Math.cos(angle) * (index % 2 === 0 ? 1.2 : 1.1); // Offset slightly
                            const y = Math.sin(angle) * (index % 2 === 0 ? 1.2 : 1.1);

                            const isCurrentSpeaker = activeSpeakerId === participant.id;

                            return (
                                <div 
                                    key={participant.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                    style={{ 
                                        left: `calc(50% + ${Math.cos(angle) * (45)}%)`, 
                                        top: `calc(50% + ${Math.sin(angle) * (60)}%)` 
                                    }}
                                >
                                    <div className="flex flex-col items-center">
                                        {/* Avatar & Chair */}
                                        <div className="relative group">
                                            {/* Chair Back */}
                                            <div className="absolute -inset-2 bg-gray-200 dark:bg-gray-700 rounded-2xl opacity-50 shadow-sm"></div>
                                            
                                            {/* Sitting indicator Circle */}
                                            <div className={`relative p-1 rounded-full border-2 transition-all duration-500 ${isCurrentSpeaker ? 'border-teal-500 scale-110 shadow-lg shadow-teal-500/20' : 'border-transparent'}`}>
                                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 bg-gray-200 shadow-md">
                                                    <img src={participant.avatarUrl} alt={participant.name} className="w-full h-full object-cover" />
                                                </div>
                                                {isCurrentSpeaker && (
                                                    <motion.div 
                                                        layoutId="speaking-indicator"
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                    >
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"></path></svg>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info Label */}
                                        <div className="mt-2 text-center">
                                            <p className="text-[11px] font-normal text-gray-900 dark:text-white leading-none truncate w-24 uppercase tracking-tighter">{participant.name}</p>
                                            <p className="text-[9px] text-gray-500 dark:text-gray-400 font-light mt-0.5">{participant.role}</p>
                                        </div>

                                        {/* Equipment on Table (Only if sitting "at" the table) */}
                                        <div 
                                            className="absolute pointer-events-none"
                                            style={{ 
                                                left: '50%',
                                                top: angle > 0 && angle < Math.PI ? '0%' : '100%',
                                                transform: `translate(-50%, ${angle > 0 && angle < Math.PI ? '-140%' : '40%'})`
                                            }}
                                        >
                                            <div className="flex gap-2">
                                                {/* Laptop */}
                                                <div className="w-10 h-6 bg-gray-100 dark:bg-gray-900 rounded-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
                                                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full opacity-50"></div>
                                                </div>
                                                {/* Console Mic */}
                                                <div className="w-3 h-3 rounded-full bg-gray-800 dark:bg-black border border-gray-600 shadow-inner"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Ambient Room Furniture / Decorations */}
                    <div className="absolute top-10 left-10 w-24 h-48 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 -rotate-12 blur-sm"></div>
                    <div className="absolute bottom-20 right-10 w-32 h-12 bg-white/50 dark:bg-gray-800/50 rounded-full border border-gray-200 dark:border-gray-700 rotate-45 blur-[2px]"></div>
                </div>

                {/* Live Transcript / MOM Area */}
                <div className="flex flex-col bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm min-h-0">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                            <SparklesIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Board Deliberations</h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none mt-0.5">Real-time MOM Generation</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scroll-bar-thumb-gray-700">
                        {meetingMinutes.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                                <PhoneIcon className="w-12 h-12 mb-4 text-gray-300" />
                                <p className="text-xs uppercase tracking-widest font-normal">Waiting for meeting to start...</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout text-normal-weight">
                                {meetingMinutes.map((log, idx) => (
                                    <motion.div 
                                        key={log + idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`p-3 rounded-2xl text-[11px] leading-relaxed border ${
                                            idx === 0 
                                            ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/40 text-teal-800 dark:text-teal-200' 
                                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 text-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                        <div className="flex gap-2">
                                            <span className="text-[9px] font-mono opacity-50 shrink-0 mt-0.5">{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                            <p className="font-normal">{log}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    {isMeetingActive && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-normal uppercase tracking-widest text-gray-500">Live Recording</span>
                             </div>
                             <button className="text-[10px] font-normal uppercase tracking-widest text-teal-600 hover:text-teal-700">Export Transcript</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
