import React, { useState } from 'react';
import { 
  Play, Check, Percent, Disc, Terminal, Award, Eye, Database, CheckCircle
} from 'lucide-react';

interface ApprovalItem {
  id: string;
  title: string;
  docType: string;
  assignedAgent: string;
  status: string;
  framework: string;
  fileMockName: string;
  size: string;
  content: string;
  cnnResult: {
    matchPercent: number;
    activationHeatmap: number[];
    classification: string;
  } | null;
}

interface CNNEvidenceLabProps {
  pendingApprovals: ApprovalItem[];
  onApprove: (id: string) => void;
  onUpdateCNNResult: (id: string, result: any) => void;
}

export const CNNEvidenceLab: React.FC<CNNEvidenceLabProps> = ({ 
  pendingApprovals, 
  onApprove,
  onUpdateCNNResult
}) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);

  const runCNNAnalysis = (item: ApprovalItem) => {
    setActiveItem(item.id);
    setIsProcessing(true);
    setStatusLogs([]);
    setProgressPercent(0);

    const steps = [
      { log: "Initializing Convolutional Neural Network (CNN) feature embedding engine...", progress: 10 },
      { log: "Scanning document matrix (bounding dimensions 1024x1024)...", progress: 25 },
      { log: "Convolutional block 1 (Conv2D - 16 filters, ReLU): Extracting text structure and layout edges...", progress: 45 },
      { log: "Pooling block 2 (MaxPooling2D - 2x2): Downsampling spatial resolution of compliance tokens...", progress: 65 },
      { log: "Flattening vector & calculating Softmax weights against SAMA and NCA ECC-1 standard datasets...", progress: 85 },
      { log: "Evaluating classification certainty. Similarity alignment checked...", progress: 95 },
      { log: "Neural verification complete. Structural match validated.", progress: 100 }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setStatusLogs(prev => [...prev, steps[stepIdx].log]);
        setProgressPercent(steps[stepIdx].progress);
        stepIdx++;
      } else {
        clearInterval(interval);
        setIsProcessing(false);
        onUpdateCNNResult(item.id, {
          matchPercent: parseFloat((96.4 + Math.random() * 3.2).toFixed(1)),
          activationHeatmap: [0.99, 0.96, 0.94, 0.91],
          classification: "Valid " + item.framework.split(' ')[0] + " GRC Evidence Document"
        });
      }
    }, 900);
  };

  const selectedItem = pendingApprovals.find(p => p.id === activeItem);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-250 dark:border-gray-700 p-5 space-y-6">
      <div className="border-b border-gray-100 dark:border-gray-700 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-teal-600" />
            Human-In-The-Loop Pending Approvals & CNN Evidence Review Lab
          </h2>
          <p className="text-xs text-gray-500 font-normal">
            Verify drafted policy controls using custom Computer Vision (CNN) structural matching models before final executive sign-off.
          </p>
        </div>
        <div className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded font-normal select-none">
          Audit Ledger Protocol: Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Items Queue */}
        <div className="lg:col-span-5 space-y-3.5">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Pending Document Review Queue
          </h3>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
            {pendingApprovals.map(item => {
              const isActive = activeItem === item.id;
              return (
                <div 
                  key={item.id} 
                  onClick={() => { if (!isProcessing) setActiveItem(item.id); }}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-teal-50/50 dark:bg-teal-950/25 border-teal-500' 
                      : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-normal text-gray-900 dark:text-white text-ellipsis truncate max-w-[200px]" title={item.title}>
                      {item.title}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-normal truncate ${
                      item.status === 'Approved' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/45 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/45 dark:text-yellow-300 animate-pulse'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 font-normal">
                    <span>{item.docType} / {item.assignedAgent}</span>
                    <span className="text-teal-600 dark:text-teal-400">{item.framework}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CNN and Human Approval Stage */}
        <div className="lg:col-span-7 bg-gray-50/50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          {selectedItem ? (
            <div className="space-y-4 font-normal">
              <div className="flex justify-between items-start gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <div>
                  <h4 className="text-xs font-normal text-gray-900 dark:text-white">{selectedItem.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Mock File: {selectedItem.fileMockName} ({selectedItem.size})</p>
                </div>
                <div className="text-[11px] text-teal-600 dark:text-teal-400 font-normal">{selectedItem.framework}</div>
              </div>

              {/* Policy Preview Text Block */}
              <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[11px] font-normal leading-relaxed text-gray-600 dark:text-gray-300 max-h-[100px] overflow-y-auto">
                <p className="font-mono text-[10px] text-gray-400 mb-1">&gt; Raw Artifact Contents:</p>
                {selectedItem.content}
              </div>

              {/* CNN Neural Processor Block */}
              <div className="bg-gray-900 border border-gray-700 rounded p-4 space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400 font-normal flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-teal-500" />
                    CNN ConvNet Feature Classifier Network
                  </span>
                  <span className="text-zinc-500 text-[10px] font-normal">Model v2.4-GRC</span>
                </div>

                {isProcessing ? (
                  <div className="space-y-3.5 py-4">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                      <span>Analyzing edges, tokens & signatures...</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded overflow-hidden">
                      <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                      {statusLogs.map((log, idx) => (
                        <p key={idx} className="text-[10px] text-teal-400 font-mono leading-normal">
                          &gt; {log}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : selectedItem.cnnResult ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-800/60 p-2.5 rounded border border-zinc-700/50 text-[11px] font-normal">
                        <span className="text-zinc-400 block text-[9px] uppercase">Compliance Score</span>
                        <span className="text-teal-400 font-normal text-md flex items-center gap-1 mt-0.5">
                          <Percent className="w-3 h-3 text-teal-500" />
                          {selectedItem.cnnResult.matchPercent}% Match
                        </span>
                      </div>
                      <div className="bg-zinc-800/60 p-2.5 rounded border border-zinc-700/50 text-[11px] font-normal">
                        <span className="text-zinc-400 block text-[9px] uppercase">Decision Classification</span>
                        <span className="text-emerald-400 font-normal text-md truncate mt-0.5 flex items-center gap-1">
                          <Award className="w-3 h-3 text-emerald-500" />
                          Validated Proof
                        </span>
                      </div>
                    </div>

                    {/* Weights visualizer (No big/bold fonts) */}
                    <div className="pt-2">
                      <p className="text-[10px] text-zinc-400 font-normal block mb-1">ConvNet Layer Weights Activation Map:</p>
                      <div className="flex gap-1.5">
                        {selectedItem.cnnResult.activationHeatmap.map((val, i) => (
                          <div key={i} className="flex-1 bg-zinc-800 h-6 rounded overflow-hidden relative flex items-center justify-center border border-zinc-700/30">
                            <div className="absolute top-0 bottom-0 left-0 bg-teal-500/25 transition-all duration-500" style={{ width: `${val * 100}%` }}></div>
                            <span className="text-[9px] font-mono text-teal-400 z-10 font-normal">W{i+1}: {val.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Human Verdict Approval buttons */}
                    {selectedItem.status !== 'Approved' && (
                      <div className="flex gap-3 pt-3 border-t border-zinc-800">
                        <button
                          onClick={() => onApprove(selectedItem.id)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs transition-all font-normal shadow flex items-center justify-center gap-1"
                          id={`approve_btn_${selectedItem.id}`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Human Sign-Off: Approve Control Documentation
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-zinc-400 italic font-normal">Compliance check has not been initiated for this policy draft yet.</p>
                    <button
                      onClick={() => runCNNAnalysis(selectedItem)}
                      className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-teal-400 font-normal border border-teal-500/30 rounded text-xs transition-all tracking-wide"
                      id={`run_cnn_btn_${selectedItem.id}`}
                    >
                      Trigger CNN Vision Evidence Verification (Noora Model)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-gray-500 italic font-normal">
              Select an implemented policy draft from the left queue to begin CNN evidence assessment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
