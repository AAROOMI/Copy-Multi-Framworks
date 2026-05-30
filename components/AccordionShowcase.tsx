import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Settings, Monitor, RefreshCw, Volume2, SwitchCamera as Switch } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
  id: string;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, icon: Icon, isOpen, onClick, children, id }) => {
  return (
    <div className="mb-4 overflow-hidden rounded-[12px] border border-white/10 backdrop-blur-md transition-all duration-300">
      <button
        id={`accordion-header-${id}`}
        onClick={onClick}
        className={`relative w-full h-[58px] px-[18px] flex items-center justify-between transition-all duration-300 group
          ${isOpen ? 'bg-white/10' : 'bg-white/5 hover:bg-white/8'}`}
      >
        {/* Holographic Shimmer Effect for Expanded Item */}
        {isOpen && (
          <motion.div
            className="absolute inset-0 z-0 pointer-events-none opacity-20"
            initial={{ backgroundPosition: '0% 0%' }}
            animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage: 'linear-gradient(135deg, transparent 0%, #FF6B6B 20%, #FFE66D 40%, #4ECDC4 60%, #45B7D1 80%, #96E6A1 100%)',
              backgroundSize: '200% 200%',
              mixBlendMode: 'overlay'
            }}
          />
        )}

        <div className="flex items-center gap-3 z-10">
          <div className={`p-1.5 rounded-md transition-colors ${isOpen ? 'text-white' : 'text-slate-400 group-hover:text-white/70'}`}>
            <Icon size={18} />
          </div>
          <span className="text-white/90 text-[14px] font-medium tracking-tight">
            {title}
          </span>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="z-10 text-white/50"
        >
          <ChevronDown size={20} />
        </motion.div>

        {/* Reflected border glow for holographic expanded state */}
        {isOpen && (
          <>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF6B6B]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#96E6A1]/30 to-transparent" />
          </>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`accordion-content-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white/5 overflow-hidden"
          >
            <div className="px-[18px] py-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToggleRow = ({ label, description }: { label: string; description: string }) => (
  <div className="flex items-center justify-between py-1 group/row">
    <div className="flex flex-col">
      <span className="text-white/90 text-[13px] font-medium">{label}</span>
      <span className="text-slate-400/80 text-[11px]">{description}</span>
    </div>
    <div className="w-9 h-5 bg-white/10 rounded-full p-1 cursor-pointer transition-colors hover:bg-white/15 relative">
      <div className="absolute left-1 top-1 w-3 h-3 bg-white/60 rounded-full" />
    </div>
  </div>
);

export const AccordionShowcase: React.FC = () => {
  const [openItem, setOpenItem] = useState<string | null>('display');

  return (
    <div 
      className="min-h-screen bg-[#0F0F1A] text-slate-100 font-sans p-8 selection:bg-cyan-500/30 overflow-hidden -m-4 md:-m-8"
      style={{ backgroundImage: 'linear-gradient(to bottom right, #0F0F1A, #1A1A2E)' }}
    >
      <div className="max-w-[700px] mx-auto mt-20 relative">
        {/* Background decorative elements */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 -right-40 w-96 h-96 bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="mb-6 flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-semibold">Accordion &mdash; Glass System</span>
          <h1 className="text-2xl font-bold tracking-tight text-white/95">Space Exploration Interface</h1>
          <p className="text-blue-gray-300/60 text-sm">Configure your deep-space vessel parameters and navigation protocols.</p>
        </div>

        <div className="w-full space-y-1">
          <AccordionItem
            id="navigation"
            title="Navigation Settings"
            icon={Settings}
            isOpen={openItem === 'nav'}
            onClick={() => setOpenItem(openItem === 'nav' ? null : 'nav')}
          >
            <div className="text-blue-gray-300 text-[13px] leading-relaxed">
              Adjust your trajectory algorithms and orbital mechanics parameters. 
              Real-time synchronization with the Kuiper Belt relay stations is recommended.
            </div>
          </AccordionItem>

          <AccordionItem
            id="display"
            title="Display Preferences"
            icon={Monitor}
            isOpen={openItem === 'display'}
            onClick={() => setOpenItem(openItem === 'display' ? null : 'display')}
          >
            <div className="space-y-4">
              <ToggleRow label="Holographic HUD" description="Enable 3D tactical overlay in the primary cockpit display." />
              <ToggleRow label="Night Mode" description="Optimizes interface brightness for deep shadow sectors." />
              <ToggleRow label="Dynamic Grid" description="Project relative coordinate mesh on all viewport glass." />
            </div>
          </AccordionItem>

          <AccordionItem
            id="data"
            title="Data Sync Options"
            icon={RefreshCw}
            isOpen={openItem === 'data'}
            onClick={() => setOpenItem(openItem === 'data' ? null : 'data')}
          >
            <div className="text-blue-gray-300 text-[13px]">
              Manage synchronization intervals with planetary terraforming logs and resource extraction trackers.
            </div>
          </AccordionItem>

          <AccordionItem
            id="audio"
            title="Audio Configuration"
            icon={Volume2}
            isOpen={openItem === 'audio'}
            onClick={() => setOpenItem(openItem === 'audio' ? null : 'audio')}
          >
            <div className="text-blue-gray-300 text-[13px]">
              Configure internal vessel acoustics and long-range subspace communication audio filters.
            </div>
          </AccordionItem>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex gap-8">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Base Material</span>
                <span className="text-[12px] text-white/60">GlassMorphism v2.4</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Accent Effect</span>
                <span className="text-[12px] text-white/60">Holo-Prism Overlay</span>
            </div>
        </div>
      </div>
    </div>
  );
};
