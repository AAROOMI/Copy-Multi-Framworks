
import React from 'react';
import { motion } from 'motion/react';
import { UserGroupIcon, KeyboardIcon, EyeIcon, MessageSquareIcon, Share2Icon, DownloadIcon, LayoutIcon } from './Icons';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  status: 'typing' | 'viewing' | 'idle';
}

const participants: Participant[] = [
  { id: '1', name: 'Noora AI', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Noora', status: 'typing' },
  { id: '2', name: 'Khalid', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Khalid', status: 'viewing' },
  { id: '3', name: 'Sarah', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', status: 'idle' },
  { id: '4', name: 'Ahmed', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', status: 'idle' },
];

export const MultiplayerWhiteboard: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#0B1120] rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/5 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-[14px] font-normal text-slate-200 tracking-tight">Compliance Roadmap 2026</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-normal">Live Collaboration Active</span>
            </div>
          </div>
        </div>

        {/* Participant Row - HERO ELEMENT */}
        <div className="flex items-center gap-8">
          {/* Status Indicators */}
          <div className="flex items-center gap-4 border-r border-white/10 pr-6 mr-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
                <KeyboardIcon className="w-3 h-3" />
              </div>
              <span className="text-[10px] text-slate-400 font-normal uppercase tracking-widest">Typing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-purple-500/10 text-purple-400">
                <EyeIcon className="w-3 h-3" />
              </div>
              <span className="text-[10px] text-slate-400 font-normal uppercase tracking-widest">Viewing</span>
            </div>
          </div>

          {/* Avatars */}
          <div className="flex -space-x-3">
            {participants.map((user) => (
              <div key={user.id} className="relative">
                {/* Animated Rims */}
                {user.status === 'typing' && (
                  <motion.div 
                    className="absolute -inset-1 rounded-full border-2 border-dashed border-cyan-400/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                )}
                {user.status === 'viewing' && (
                  <motion.div 
                    className="absolute -inset-1 rounded-full border-2 border-purple-500/50"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                
                {/* Avatar Image */}
                <div className={`relative w-8 h-8 rounded-full border-2 border-[#0B1120] overflow-hidden bg-slate-800 ${user.status !== 'idle' ? 'z-10' : ''}`}>
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>

                {/* Mini Status Badge */}
                {user.status !== 'idle' && (
                   <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-[#0B1120] flex items-center justify-center z-20 ${user.status === 'typing' ? 'bg-cyan-500' : 'bg-purple-500'}`}>
                      {user.status === 'typing' ? <KeyboardIcon className="w-1.5 h-1.5 text-white" /> : <EyeIcon className="w-1.5 h-1.5 text-white" />}
                   </div>
                )}
              </div>
            ))}
            
            {/* Invite Button */}
            <button className="w-8 h-8 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-white/30 transition-all ml-4">
              <Share2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
           <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
              <DownloadIcon className="w-4 h-4" />
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-teal-600/20 border border-teal-500/30 rounded-xl text-[11px] font-normal text-teal-400 uppercase tracking-widest hover:bg-teal-600/30 transition-all">
              <LayoutIcon className="w-4 h-4" />
              <span>Snapshot</span>
           </button>
        </div>
      </header>

      {/* Main Canvas - Faded Heritage Look */}
      <main className="flex-1 relative overflow-hidden flex items-center justify-center">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Faded Content Samples */}
        <div className="relative w-full h-full flex items-center justify-center opacity-10 grayscale pointer-events-none">
           <div className="w-[800px] h-[600px] border border-white/20 rounded-3xl p-12 flex flex-col gap-8">
              <div className="h-4 bg-white/20 rounded-full w-1/3"></div>
              <div className="grid grid-cols-2 gap-8">
                 <div className="h-32 bg-white/10 rounded-2xl"></div>
                 <div className="h-32 bg-white/10 rounded-2xl"></div>
              </div>
              <div className="space-y-4">
                <div className="h-2 bg-white/10 rounded-full w-full"></div>
                <div className="h-2 bg-white/10 rounded-full w-4/5"></div>
                <div className="h-2 bg-white/10 rounded-full w-5/6"></div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                 <div className="w-24 h-8 bg-white/20 rounded-lg"></div>
                 <div className="w-24 h-8 bg-white/20 rounded-lg"></div>
              </div>
           </div>
        </div>

        {/* Floating Controls Overlay (Subtle) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
           {[1, 2, 3, 4].map(i => (
             <button key={i} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <div className="w-4 h-4 border border-current rounded-sm"></div>
             </button>
           ))}
           <div className="w-px h-6 bg-white/10 mx-1"></div>
           <button className="p-2 px-3 text-[10px] font-normal text-teal-400 uppercase tracking-widest hover:text-teal-300">
             Canvas Settings
           </button>
        </div>

        {/* Cursor Indicators (Subtle) */}
        <motion.div 
          className="absolute top-1/3 left-1/3 z-30"
          animate={{ x: [0, 50, -20, 0], y: [0, -30, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative">
             <svg className="w-6 h-6 text-cyan-400 fill-current drop-shadow-lg" viewBox="0 0 24 24"><path d="M7 2l12 11.2l-5.8 0.5l3.3 7.3l-2.2 1l-3.2-7.4l-4.1 3.9z"></path></svg>
             <div className="absolute top-full left-full mt-1 bg-cyan-500 text-white text-[9px] font-normal px-2 py-0.5 rounded-full uppercase tracking-tighter whitespace-nowrap shadow-lg">Noora AI</div>
          </div>
        </motion.div>

        <motion.div 
          className="absolute bottom-1/4 right-1/4 z-30"
          animate={{ x: [0, -40, 20, 0], y: [0, 20, -50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="relative">
             <svg className="w-6 h-6 text-purple-500 fill-current drop-shadow-lg" viewBox="0 0 24 24"><path d="M7 2l12 11.2l-5.8 0.5l3.3 7.3l-2.2 1l-3.2-7.4l-4.1 3.9z"></path></svg>
             <div className="absolute top-full left-full mt-1 bg-purple-600 text-white text-[9px] font-normal px-2 py-0.5 rounded-full uppercase tracking-tighter whitespace-nowrap shadow-lg">Khalid (Viewing)</div>
          </div>
        </motion.div>
      </main>

      {/* Subtle Glows */}
      <div className="absolute top-0 left-1/4 w-[400px] h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent blur-sm"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent blur-sm"></div>
    </div>
  );
};
