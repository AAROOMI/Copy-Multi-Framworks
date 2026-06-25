import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces
interface Creator {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  level: 'basic' | 'domain' | 'manual';
  about: string;
  stats: {
    followers: string;
    engagement: string;
    category: string;
  };
}

export const CreatorMarketplace: React.FC = () => {
  const creators: Creator[] = [
    {
      id: '1',
      name: 'basic',
      tagline: 'Basic creator profile, initialized',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      level: 'basic',
      about: 'Visual artist and content curator focusing on minimalist digital design.',
      stats: { followers: '12K', engagement: '4.2%', category: 'Digital Art' }
    },
    {
      id: '2',
      name: 'domain verified',
      tagline: 'Domain verified organization',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      level: 'domain',
      about: 'Enterprise level identity established on decentralization platforms.',
      stats: { followers: '45K', engagement: '5.8%', category: 'Enterprise' }
    },
    {
      id: '3',
      name: 'Nanner Verified',
      tagline: 'Tag nual review, Reviewed',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      level: 'manual',
      about: 'Verified elite creator. Manually screened, reviewed and certified for premium integration.',
      stats: { followers: '180K', engagement: '9.4%', category: 'Content Creation' }
    },
    {
      id: '4',
      name: 'Nanner Ferifiel',
      tagline: 'Manual reviewed expert',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      level: 'manual',
      about: 'Brand strategist and director certified for high-fidelity compliance content.',
      stats: { followers: '92K', engagement: '8.1%', category: 'Brand Strategy' }
    },
    {
      id: '5',
      name: 'Namer Verified',
      tagline: 'Domain cleared identity',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
      level: 'domain',
      about: 'Cybersecurity standards mapping and collaborative design architect.',
      stats: { followers: '34K', engagement: '6.3%', category: 'Cybersecurity' }
    }
  ];

  const [selectedId, setSelectedId] = useState<string>('3'); // Default to Nanner Verified
  const [hoveredBadgeId, setHoveredBadgeId] = useState<string | null>(null);
  const [messageSent, setMessageSent] = useState(false);

  const selectedCreator = creators.find(c => c.id === selectedId) || creators[2];

  // Render Badge based on 3-level verification system
  const renderBadge = (level: 'basic' | 'domain' | 'manual', isHighestLarge = false) => {
    if (level === 'basic') {
      // Simple dot badge
      return (
        <div className={`flex items-center justify-center rounded-full bg-slate-900 border border-white text-white ${isHighestLarge ? 'w-5 h-5' : 'w-4 h-4'}`}>
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (level === 'domain') {
      // Shield badge
      return (
        <div className={`flex items-center justify-center rounded bg-slate-800 border border-white text-white ${isHighestLarge ? 'w-5 h-5' : 'w-4 h-4'}`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else {
      // Star badge (Manual Review - highest level, with gold/yellow accent)
      return (
        <div className={`flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border border-white text-slate-900 shadow-md ${isHighestLarge ? 'w-5 h-5' : 'w-4 h-4'}`}>
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
  };

  const handleMessage = () => {
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-6 md:p-12 font-sans overflow-hidden select-none">
      {/* Outer Shell resembling the polished editorial image */}
      <div className="w-full max-w-4xl bg-white/70 backdrop-blur-2xl rounded-[32px] border border-white/80 shadow-[0_24px_80px_rgba(0,0,0,0.06),_inset_0_2px_4px_rgba(255,255,255,0.9)] overflow-hidden flex flex-col md:flex-row h-[680px]">
        
        {/* Left Creator List Column */}
        <div className="w-full md:w-[45%] border-r border-[#E2E8F0] flex flex-col h-full bg-white/40">
          <div className="p-6 pb-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Creator</h2>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9] px-3">
            {creators.map((creator) => {
              const works = creator.id === selectedId;
              return (
                <div
                  key={creator.id}
                  onClick={() => setSelectedId(creator.id)}
                  className={`flex items-center justify-between p-4 my-1 rounded-2xl cursor-pointer transition-all duration-300 relative ${
                    works 
                      ? 'bg-slate-100/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_4px_12px_rgba(0,0,0,0.02)]' 
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Avatar with Tiny verification badge near Top-Right Edge */}
                    <div className="relative">
                      <img 
                        src={creator.avatar} 
                        alt={creator.name} 
                        className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]" 
                      />
                      <div className="absolute -top-1 -right-1">
                        {renderBadge(creator.level)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-[14px] font-medium text-slate-800 tracking-tight leading-none mb-1">
                        {creator.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal truncate max-w-[150px]">
                        {creator.tagline}
                      </span>
                    </div>
                  </div>

                  {/* Verification Interactive Point */}
                  <div 
                    className="relative p-2"
                    onMouseEnter={() => setHoveredBadgeId(creator.id)}
                    onMouseLeave={() => setHoveredBadgeId(null)}
                  >
                    <div className="transition-transform duration-200 hover:scale-115">
                      {renderBadge(creator.level)}
                    </div>

                    {/* Verification Hover Card over the badge with compact rows */}
                    <AnimatePresence>
                      {hoveredBadgeId === creator.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 right-0 top-8 w-52 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_12px_32px_rgba(15,23,42,0.12)] p-3.5 space-y-2 pointer-events-none"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Logs</span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium">Active</span>
                          </div>
                          <div className={`flex items-center justify-between text-[11px] font-medium transition-colors ${creator.level === 'basic' ? 'text-slate-800' : 'text-slate-400'}`}>
                            <div className="flex items-center gap-2">
                              {renderBadge('basic')}
                              <span>Basic</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">Level 1</span>
                          </div>
                          
                          <div className={`flex items-center justify-between text-[11px] font-medium transition-colors ${creator.level === 'domain' ? 'text-slate-800' : 'text-slate-400'}`}>
                            <div className="flex items-center gap-2">
                              {renderBadge('domain')}
                              <span>domain Verified</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">Level 2</span>
                          </div>

                          <div className={`flex items-center justify-between text-[11px] font-medium transition-colors ${creator.level === 'manual' ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
                            <div className="flex items-center gap-2">
                              {renderBadge('manual')}
                              <span className={creator.level === 'manual' ? 'text-amber-600' : ''}>manual Reviewed</span>
                            </div>
                            <span className="text-[10px] text-amber-500 font-bold">Elite</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Preview Panel featuring the selected focal point creator */}
        <div className="flex-1 flex flex-col h-full bg-[#FAFAFB] relative justify-center items-center p-8">
          <div className="absolute top-6 right-6">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>

          {/* Focal Creator Content Card */}
          <div className="w-full max-w-sm flex flex-col items-center text-center">
            
            {/* Avatar Frame with custom radial halo effect / outer glow */}
            <div className="relative mb-6">
              {/* Infinite rotating warm halo light backdrop if manual reviewed, or clean white otherwise */}
              <div className={`absolute -inset-2.5 rounded-full blur-[10px] opacity-65 transition-all duration-500 ${
                selectedCreator.level === 'manual' 
                  ? 'bg-gradient-to-tr from-amber-200 via-amber-100 to-yellow-300 animate-pulse' 
                  : 'bg-slate-200/40'
              }`} />
              
              <div className="relative p-0.5 rounded-full bg-white shadow-xl">
                <img 
                  src={selectedCreator.avatar} 
                  alt={selectedCreator.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-white" 
                />
                
                {/* Micro badge of high correctness inside the outer boundary */}
                <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 scale-110">
                  {renderBadge(selectedCreator.level, true)}
                </div>
              </div>
            </div>

            <h1 className="text-[20px] font-bold text-slate-800 tracking-tight mb-1">
              {selectedCreator.name}
            </h1>
            
            {/* Tagline matching formatting in requested specification */}
            <p className="text-[12px] font-medium text-slate-400 tracking-wide mb-4 uppercase">
              {selectedCreator.tagline}
            </p>

            {/* About text to give professional weight */}
            <p className="text-[12px] text-slate-500 leading-relaxed max-w-[280px] mb-8 font-normal">
              {selectedCreator.about}
            </p>

            {/* Quick Metrics Divider */}
            <div className="grid grid-cols-3 gap-6 w-full border-t border-b border-slate-100 py-4 mb-8">
              <div>
                <span className="block text-[14px] font-bold text-slate-700">{selectedCreator.stats.followers}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Followers</span>
              </div>
              <div>
                <span className="block text-[14px] font-bold text-slate-700">{selectedCreator.stats.engagement}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Engagement</span>
              </div>
              <div>
                <span className="block text-[14px] font-bold text-slate-700">{selectedCreator.stats.category}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Tier</span>
              </div>
            </div>

            {/* Editorial Action Buttons */}
            <div className="w-full space-y-2">
              <button
                onClick={handleMessage}
                disabled={messageSent}
                className={`w-full py-3.5 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-all duration-300 border ${
                  messageSent 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                    : 'bg-[#0f172a] hover:bg-slate-800 text-white border-transparent shadow-[0_10px_30px_rgba(15,23,42,0.15)] hover:shadow-none'
                }`}
              >
                {messageSent ? 'Signal Transmitted' : 'Message'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
