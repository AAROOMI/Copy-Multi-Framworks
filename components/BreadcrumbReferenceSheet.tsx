
import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

interface BreadcrumbItemProps {
  label: string;
  isLast?: boolean;
  isHovered?: boolean;
  isDisabled?: boolean;
  isCurrent?: boolean;
  isTruncated?: boolean;
  isNextCurrent?: boolean;
}

const HolographicChevron = ({ disabled, opacity = 1 }: { disabled?: boolean; opacity?: number }) => {
  return (
    <div 
      className="flex items-center justify-center mx-1.5 overflow-hidden"
      style={{ opacity }}
    >
      <motion.svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={disabled ? { stroke: "#334155" } : {}}
      >
        {!disabled && (
          <defs>
            <linearGradient id="holoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <motion.stop 
                offset="0%" 
                animate={{ stopColor: ["#06B6D4", "#8B5CF6", "#F43F5E", "#06B6D4"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.stop 
                offset="50%" 
                animate={{ stopColor: ["#F43F5E", "#06B6D4", "#8B5CF6", "#F43F5E"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.stop 
                offset="100%" 
                animate={{ stopColor: ["#8B5CF6", "#F43F5E", "#06B6D4", "#8B5CF6"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </linearGradient>
            <filter id="chromaticAberration">
              <feOffset in="SourceGraphic" dx="-0.4" dy="0" result="red" />
              <feOffset in="SourceGraphic" dx="0.4" dy="0" result="blue" />
              <feBlend in="red" in2="blue" mode="screen" />
            </filter>
          </defs>
        )}
        <motion.polyline
          points="9 18 15 12 9 6"
          stroke={disabled ? "#334155" : "url(#holoGradient)"}
          style={!disabled ? { filter: "url(#chromaticAberration)" } : {}}
          animate={!disabled ? {
            opacity: [0.9, 1, 0.9],
            scale: [1, 1.05, 1],
          } : {}}
          transition={!disabled ? {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
        />
      </motion.svg>
    </div>
  );
};

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ 
  label, 
  isLast, 
  isHovered, 
  isDisabled, 
  isCurrent,
  isTruncated,
  isNextCurrent
}) => {
  return (
    <div className={`flex items-center h-[44px] ${isDisabled ? 'opacity-35' : 'opacity-100'}`}>
      <div className="relative flex items-center h-full cursor-pointer group">
        {isTruncated ? (
          <div className="flex items-center gap-1.5 px-0">
             <span className="text-slate-600 font-medium text-[13px] leading-[18px] tracking-[0.02em] border-b border-dotted border-slate-600 mb-[-1px]">
               ...
             </span>
          </div>
        ) : (
          <span 
            className={`
              text-[13px] leading-[18px] tracking-[0.02em] transition-colors duration-200
              ${isCurrent ? 'text-slate-100 font-semibold cursor-default' : 'text-blue-400 font-medium'}
              ${isHovered ? 'text-blue-300' : ''}
              ${isDisabled ? 'text-slate-500' : ''}
            `}
          >
            {label}
          </span>
        )}
        
        {isHovered && !isCurrent && !isDisabled && (
          <motion.div 
            layoutId="underline"
            className="absolute bottom-[13px] left-0 right-0 h-[1px] bg-blue-300"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </div>
      
      {!isLast && (
        <HolographicChevron disabled={isDisabled} opacity={isNextCurrent ? 0.4 : 1} />
      )}
    </div>
  );
};

export const BreadcrumbReferenceSheet: React.FC = () => {
  return (
    <div 
      className="min-h-screen bg-[#0B1120] text-slate-100 font-sans p-8 selection:bg-blue-500/30 -m-4 md:-m-8"
      style={{ backgroundImage: 'radial-gradient(circle at center, #111827 0%, #0B1120 100%)' }}
    >
      <div className="max-w-[1200px] mx-auto pt-8">
        <header className="mb-12">
          <h1 className="text-2xl font-semibold mb-2 tracking-tight text-white">Breadcrumb Navigation States</h1>
          <p className="text-slate-400 text-sm">Systematic reference for enterprise SaaS navigation components.</p>
        </header>

        <div className="space-y-6">
          {/* Row 1: Default */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Row 1 &mdash; Default</span>
              <span className="text-[10px] text-slate-600 font-mono">STATE: IDLE</span>
            </div>
            <div className="flex items-center h-[48px] px-0">
              <BreadcrumbItem label="Home" />
              <BreadcrumbItem label="Dashboard" />
              <BreadcrumbItem label="Analytics" />
              <BreadcrumbItem label="Reports" isLast />
            </div>
            <div className="h-[1px] bg-[#1E293B] mt-4" />
          </div>

          {/* Row 2: Hover */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Row 2 &mdash; Hover</span>
              <span className="text-[10px] text-slate-600 font-mono">TARGET: ANALYTICS</span>
            </div>
            <div className="flex items-center h-[48px] px-0">
              <BreadcrumbItem label="Home" />
              <BreadcrumbItem label="Dashboard" />
              <BreadcrumbItem label="Analytics" isHovered />
              <BreadcrumbItem label="Reports" isLast />
            </div>
            <div className="h-[1px] bg-[#1E293B] mt-4" />
          </div>

          {/* Row 3: Current Page */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Row 3 &mdash; Current Page</span>
              <span className="text-[10px] text-slate-600 font-mono">ACTIVE: REPORTS</span>
            </div>
            <div className="flex items-center h-[48px] px-0 text-slate-100">
              <BreadcrumbItem label="Home" />
              <BreadcrumbItem label="Dashboard" />
              <BreadcrumbItem label="Analytics" isNextCurrent />
              <BreadcrumbItem label="Reports" isCurrent isLast />
            </div>
            <div className="h-[1px] bg-[#1E293B] mt-4" />
          </div>

          {/* Row 4: Truncated */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Row 4 &mdash; Truncated</span>
              <span className="text-[10px] text-slate-600 font-mono">COLLAPSED PATH</span>
            </div>
            <div className="flex items-center h-[48px] px-0">
              <BreadcrumbItem label="Home" />
              <BreadcrumbItem label="..." isTruncated />
              <BreadcrumbItem label="Reports" isLast />
            </div>
            <div className="h-[1px] bg-[#1E293B] mt-4" />
          </div>

          {/* Row 5: Disabled */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Row 5 &mdash; Disabled</span>
              <span className="text-[10px] text-slate-600 font-mono">ENTIRE TRAIL</span>
            </div>
            <div className="flex items-center h-[48px] px-0">
              <BreadcrumbItem label="Home" isDisabled />
              <BreadcrumbItem label="Dashboard" isDisabled />
              <BreadcrumbItem label="Analytics" isDisabled />
              <BreadcrumbItem label="Reports" isLast isDisabled />
            </div>
            <div className="h-[1px] bg-[#1E293B] mt-4" />
          </div>
        </div>

        <section className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 text-slate-400 text-[11px] uppercase tracking-[0.05em] border-t border-slate-800 pt-8">
           <div>
              <h3 className="text-slate-100 mb-4 font-semibold">Technical Specifications</h3>
              <ul className="space-y-2">
                 <li>Background: #0B1120 Slant Gradient</li>
                 <li>Primary Font: Inter / 13px / 18px Leading</li>
                 <li>Weights: Medium (400) / Semibold (600)</li>
                 <li>Touch Target: 44px Height</li>
              </ul>
           </div>
           <div>
              <h3 className="text-slate-100 mb-4 font-semibold">Visual Identity</h3>
              <ul className="space-y-2">
                 <li>Link: #60A5FA (Blue-400)</li>
                 <li>Active: #F1F5F9 (Slate-100)</li>
                 <li>Separator: Prism Holographic Chevron</li>
                 <li>Effect: 1px Chromatic Aberration</li>
              </ul>
           </div>
        </section>
      </div>
    </div>
  );
};
