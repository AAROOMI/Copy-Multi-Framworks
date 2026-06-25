import React, { useState } from 'react';
import { 
  FileText, Play, Square, Laptop, Smartphone, Terminal, Volume2, Key, Info, CheckCircle
} from 'lucide-react';

interface DevOpsDocsProps {
  onSpeakText: (text: string) => void;
}

export const DevOpsDocs: React.FC<DevOpsDocsProps> = ({ onSpeakText }) => {
  const [narratingIdx, setNarratingIdx] = useState<number | null>(null);

  const docsParagraphs = [
    {
      title: "1. Windows Desktop Installation (Local Application Setup)",
      desc: "To package and deploy the GRC and Cybersecurity Department suite as a native installable Desktop application on Windows environments, run the build instructions. This translates Vite scripts into optimized executables.",
      code: "# Generate local package targets for Windows desktop\nnpm install -g electron builder\nnpm run package:windows\n# Launch standalone executable shell\n.\\dist\\win-unpacked\\CyberSecurityGRC.exe"
    },
    {
      title: "2. Enterprise Container Deployment (Dockerfile Guide)",
      desc: "This application contains a robust, isolated containerization scheme allowing DevOps teams to launch unified multi-agent sandboxes instantly. The Nginx block safely terminates host assets.",
      code: "FROM mcr.microsoft.com/mirror/docker/library/node:20-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM mcr.microsoft.com/mirror/docker/library/nginx:alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\n# Expose port 3000 mapping internal reverse proxies\nEXPOSE 3000"
    },
    {
      title: "3. Continuous GCP Firebase Firestore Integration Scheme",
      desc: "The cloud platform links securely into the Firestore backend. All state modifications, boardroom Minutes of Meeting, risk logs, and policy additions persist on user-authored databases.",
      code: "// Database schema assertions mapping Firestore keys\nexport const databaseURL = \"https://gen-lang-client-0539526472-default-rtdb.asia-southeast1.firebasedatabase.app\";\nexport const projectId = \"gen-lang-client-0539526472\";"
    }
  ];

  const handleNarrate = (idx: number, text: string) => {
    if (narratingIdx === idx) {
      window.speechSynthesis.cancel();
      setNarratingIdx(null);
    } else {
      window.speechSynthesis.cancel();
      setNarratingIdx(idx);
      onSpeakText(text);
      // Wait for speech to terminate
      const checkSpeech = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setNarratingIdx(null);
          clearInterval(checkSpeech);
        }
      }, 500);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-250 dark:border-gray-700 p-5 space-y-6">
      <div className="border-b border-gray-100 dark:border-gray-700 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Laptop className="w-4 h-4 text-teal-600" />
            DevOps Deployment Manual, Docker Systems & Windows Desktop Setup
          </h2>
          <p className="text-xs text-gray-500 font-normal">
            Comprehensive production configuration, Docker staging blocks, and localized Windows desktop compilation recipes read back dynamically via Natural Voice Narration.
          </p>
        </div>
        <div className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded font-normal select-none">
          Drafted: Release 3.1
        </div>
      </div>

      <div className="space-y-6">
        {docsParagraphs.map((par, pIdx) => {
          const isNarrating = narratingIdx === pIdx;
          return (
            <div key={pIdx} className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 relative">
              {/* Header block with Voice Walkthrough buttons */}
              <div className="flex justify-between items-start gap-3">
                <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-teal-600" />
                  {par.title}
                </h3>
                <button
                  onClick={() => handleNarrate(pIdx, par.desc)}
                  className={`p-1 px-2.5 rounded text-[11px] font-normal transition-all flex items-center gap-1 border ${
                    isNarrating
                      ? "bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
                      : "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200"
                  }`}
                  id={`narr_btn_${pIdx}`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isNarrating ? "Stop Audio" : "Play Natural Audio Walkthrough"}</span>
                </button>
              </div>

              {/* Description Paragraph */}
              <p className="text-xs text-gray-600 dark:text-gray-350 leading-relaxed font-normal">
                {par.desc}
              </p>

              {/* Copyable code instructions */}
              <div className="p-3.5 bg-gray-900/90 text-zinc-300 border border-zinc-800 rounded text-[11px] font-mono leading-relaxed select-all relative">
                <span className="absolute top-2 right-2 text-[9px] text-zinc-500 text-right select-none font-normal uppercase">Copy Block</span>
                <pre className="whitespace-pre-wrap">{par.code}</pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
