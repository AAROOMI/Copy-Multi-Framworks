
import React, { useState } from 'react';
import { AIService } from '../services/aiService';
import { AgentService, type OrchestratorDecision } from '../services/agentService';
import type { ComplianceGap, AgentLogEntry, Permission, AssessmentItem, EvidenceValidation } from '../types';
import { SparklesIcon, EyeIcon, CheckCircleIcon, CloseIcon, ShieldCheckIcon, ShieldAlertIcon, ActivityIcon, PlusCircleIcon } from './Icons';

interface ComplianceAgentPageProps {
    onRunAnalysis: () => ComplianceGap[];
    onGenerateDocuments: (gaps: ComplianceGap[]) => Promise<void>;
    agentLog: AgentLogEntry[];
    permissions: Set<Permission>;
    assessments?: {
        ecc: AssessmentItem[];
        pdpl: AssessmentItem[];
        sama: AssessmentItem[];
        cma: AssessmentItem[];
    };
}

export const ComplianceAgentPage: React.FC<ComplianceAgentPageProps> = ({ onRunAnalysis, onGenerateDocuments, agentLog, permissions, assessments }) => {
    const [activeTab, setActiveTab] = useState<'text' | 'vision' | 'orchestrator'>('orchestrator');
    const [gaps, setGaps] = useState<ComplianceGap[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Orchestrator State
    const [orchestratorQuery, setOrchestratorQuery] = useState('');
    const [orchestratorResult, setOrchestratorResult] = useState<any>(null);
    const [isOrchestratorRunning, setIsOrchestratorRunning] = useState(false);
    
    // Vision Audit State
    const [isVisionRunning, setIsVisionRunning] = useState(false);
    const [visionResults, setVisionResults] = useState<{item: AssessmentItem, result: EvidenceValidation}[]>([]);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalEvidence, setTotalEvidence] = useState(0);

    const canRunAgent = permissions.has('complianceAgent:run');

    const handleRunAnalysis = () => {
        setIsAnalyzing(true);
        // Simulate a short delay for better UX
        setTimeout(() => {
            const foundGaps = onRunAnalysis();
            setGaps(foundGaps);
            setIsAnalyzing(false);
        }, 500);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        await onGenerateDocuments(gaps);
        setGaps([]); // Clear gaps after generation is initiated
        setIsGenerating(false);
    };

    const handleRunVisionAudit = async () => {
        // ... (existing vision logic)
    };

    const handleOrchestratorQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orchestratorQuery.trim()) return;

        setIsOrchestratorRunning(true);
        try {
            const result = await AgentService.conductMeeting(orchestratorQuery, {
                company: {}, // In a real scenario, pass company profile
                users: [],
                assessments: assessments || {},
                documents: []
            });
            setOrchestratorResult(result);
        } catch (error) {
            console.error("Orchestrator feedback failed:", error);
        } finally {
            setIsOrchestratorRunning(false);
        }
    };

    const getStatusColor = (status: AgentLogEntry['status']) => {
        switch(status) {
            case 'success': return 'text-green-500';
            case 'working': return 'text-blue-500';
            case 'error': return 'text-red-500';
            case 'info':
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl font-normal text-gray-800 dark:text-gray-100 tracking-tight">Compliance Agent</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Deploy specialized AI Agents for text analysis and visual evidence auditing.</p>
            </div>

            {/* Agent Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('orchestrator')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm flex items-center gap-2 ${activeTab === 'orchestrator' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <ShieldCheckIcon className="w-4 h-4" />
                        Team Orchestrator
                    </button>
                    <button
                        onClick={() => setActiveTab('text')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm ${activeTab === 'text' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Gap Analysis Agent
                    </button>
                    <button
                        onClick={() => setActiveTab('vision')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm flex items-center gap-2 ${activeTab === 'vision' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <EyeIcon className="w-4 h-4" />
                        Deep Vision Auditor
                    </button>
                </nav>
            </div>
            
            {activeTab === 'orchestrator' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100 mb-4">Multi-Agent GRC Orchestrator</h2>
                        <form onSubmit={handleOrchestratorQuery} className="space-y-4">
                            <textarea
                                value={orchestratorQuery}
                                onChange={(e) => setOrchestratorQuery(e.target.value)}
                                placeholder="Example: Is this vendor compliant with Saudi PDPL based on our encryption tokens?"
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                rows={2}
                            />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-500">Language: Automatic (Multi-lingual supported)</p>
                                <button
                                    type="submit"
                                    disabled={isOrchestratorRunning || !orchestratorQuery.trim()}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:bg-gray-400 flex items-center gap-2"
                                >
                                    {isOrchestratorRunning && (
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    )}
                                    Activate GRC Team
                                </button>
                            </div>
                        </form>
                    </div>

                    {orchestratorResult && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Summary & Decision */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-teal-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-normal text-gray-900 dark:text-gray-100">Decision Outcome</h3>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-normal uppercase tracking-wider ${
                                                orchestratorResult.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                                                orchestratorResult.complianceStatus === 'non-compliant' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {orchestratorResult.complianceStatus}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-normal uppercase tracking-wider ${
                                                orchestratorResult.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                                orchestratorResult.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                Risk: {orchestratorResult.riskLevel}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{orchestratorResult.summary}</p>
                                    
                                    <div className="mt-6">
                                        <h4 className="text-sm font-normal text-gray-500 uppercase flex items-center gap-2 mb-3">
                                            <ActivityIcon className="w-4 h-4" />
                                            Multi-Agent Reasoning Trace
                                        </h4>
                                        <div className="space-y-3">
                                            {orchestratorResult.agentTrace.map((node: any, i: number) => (
                                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-100 dark:border-gray-800">
                                                    <p className="text-xs font-normal text-teal-600 dark:text-teal-400 mb-1">{node.agentRole}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{node.reasoning}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NFAs */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-normal text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                        <ShieldAlertIcon className="w-5 h-5 text-orange-500" />
                                        Next Follow-up Actions (NFA)
                                    </h3>
                                    <div className="space-y-4">
                                        {orchestratorResult.nfa.map((task: any, i: number) => (
                                            <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/10 flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[10px] uppercase font-normal px-1.5 py-0.5 rounded ${
                                                        task.priority === 'critical' ? 'bg-red-600 text-white' :
                                                        task.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                                    }`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">{task.status}</span>
                                                </div>
                                                <p className="text-sm text-gray-800 dark:text-gray-200">{task.action}</p>
                                                <button className="mt-2 text-[10px] font-normal text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 uppercase tracking-tighter">
                                                    <PlusCircleIcon className="w-3 h-3" /> Assign To Expert
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'text' && (
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                            <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100">Automated Gap Analysis</h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Scan all assessments for non-compliant controls that are missing documentation.</p>
                        </div>
                        {canRunAgent ? (
                            <button
                                onClick={handleRunAnalysis}
                                disabled={isAnalyzing || isGenerating}
                                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? "Analyzing..." : "Analyze Assessments"}
                            </button>
                        ) : (
                            <p className="mt-4 sm:mt-0 text-sm text-gray-500">You don't have permission to run the agent.</p>
                        )}
                    </div>

                    {gaps.length > 0 && (
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-normal text-gray-800 dark:text-gray-200">Identified Gaps ({gaps.length})</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">The following controls are not fully compliant and lack a corresponding policy document.</p>
                            
                            <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {gaps.map(gap => (
                                        <li key={gap.controlCode} className="px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                                            <div>
                                                <p className="font-normal font-mono text-sm text-gray-800 dark:text-gray-200">{gap.controlCode} <span className="text-xs font-sans text-gray-500">({gap.framework})</span></p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{gap.controlName}</p>
                                            </div>
                                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{gap.assessedStatus.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {canRunAgent && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-normal rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating Documents...
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                                                Generate All Missing Documents
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'vision' && (
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                Deep Vision Auditor
                                <span className="text-xs font-normal bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-200">CNN Powered</span>
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                This agent uses Computer Vision to visually inspect uploaded evidence (screenshots, diagrams) and validate if they support the implemented control.
                            </p>
                        </div>
                        {canRunAgent && (
                            <button
                                onClick={handleRunVisionAudit}
                                disabled={isVisionRunning}
                                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isVisionRunning ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Scanning Evidence ({processedCount}/{totalEvidence})...
                                    </>
                                ) : (
                                    "Run CNN Validation Protocol"
                                )}
                            </button>
                        )}
                    </div>

                    {isVisionRunning && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-6">
                            <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(processedCount / totalEvidence) * 100}%` }}></div>
                        </div>
                    )}

                    {visionResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {visionResults.map(({ item, result }, idx) => (
                                <div key={idx} className={`flex gap-4 p-4 rounded-lg border-l-4 shadow-sm bg-gray-50 dark:bg-gray-900/50 ${result.isValid ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <div className="flex-shrink-0">
                                        {/* Thumbnail of evidence */}
                                        <img src={item.evidence?.dataUrl} alt="Evidence" className="w-20 h-20 object-cover rounded border border-gray-300 dark:border-gray-600" />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-normal text-gray-800 dark:text-gray-200 font-mono">{item.controlCode}</h4>
                                            <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${result.isValid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                                {result.isValid ? 'VALIDATED' : 'REJECTED'} ({result.confidence}%)
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{item.controlName}</p>
                                        <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                            <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                                                <span className="font-normal text-purple-600 dark:text-purple-400">AI Reasoning:</span> {result.reasoning}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        !isVisionRunning && <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded border border-dashed border-gray-300 dark:border-gray-700">
                            <EyeIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-500">No visual audit results yet. Upload evidence in assessment controls and click "Run CNN Validation Protocol".</p>
                        </div>
                    )}
                </div>
            )}

            {/* Shared Log */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                 <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100">Agent Activity Log</h2>
                 <div className="mt-4 max-h-80 overflow-y-auto bg-gray-900 text-white font-mono text-sm p-4 rounded-md">
                    {agentLog.length > 0 ? (
                        agentLog.map(log => (
                            <p key={log.id}>
                                <span className="text-gray-500 mr-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`${getStatusColor(log.status)}`}>{log.message}</span>
                            </p>
                        ))
                    ) : (
                        <p className="text-gray-500">No agent activity yet.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};
