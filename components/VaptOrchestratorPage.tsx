
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AIService } from '../services/aiService';
import { BugAntIcon, ExclamationTriangleIcon } from './Icons';
import type { VaptFinding, AuditAction, Permission, Asset } from '../types';

interface VaptOrchestratorPageProps {
    permissions: Set<Permission>;
    addAuditLog: (action: AuditAction, details: string) => void;
    assets?: Asset[]; // Pass assets for selection
}

// --- Mock Tools Implementation (Same as before) ---
const mockStartScan = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { 
        scan_id: `SCAN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, 
        status: 'running', 
        estimated_time: '45m',
        message: 'Scan initiated successfully on requested targets.'
    };
};

const mockGetScanStatus = async (params: { scan_id: string }) => {
    const statuses = ['running', 'analyzing', 'finalizing', 'completed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    return { scan_id: params.scan_id, status: randomStatus, progress: Math.floor(Math.random() * 100) + '%' };
};

const mockGetFindings = async (params: { scan_id: string }) => {
    return {
        scan_id: params.scan_id,
        tool: "tenable",
        summary: { assets_scanned: 54, critical: 3, high: 11, medium: 27, low: 19, info: 40 },
        findings: [
            { id: "F-0001", severity: "critical", asset: "10.10.1.25", title: "Remote Code Execution", cve: ["CVE-2024-XXXX"], cwe: ["CWE-94"], cvss: 9.8, evidence: { scanner_plugin: "PLUGIN-12345", observed: "Service version indicates vulnerable build", proof: "Banner / fingerprint / vuln check output" }, impact: "Potential full compromise of host.", recommendation: "Patch to vendor-fixed version.", references: ["vendor_advisory"] }
        ]
    };
};

const mockStopScan = async (params: { scan_id: string }) => {
    return { scan_id: params.scan_id, status: 'stopped', message: 'Scan halted by user request.' };
};

const mockGenerateReport = async (params: { scan_id: string, report_type: string, format: string }) => {
    return { 
        report_url: `https://vapt-platform.internal/reports/${params.scan_id}_${params.report_type}.${params.format}`,
        message: 'Report generated successfully.'
    };
};

const tools: FunctionDeclaration[] = [
    { name: "vapt_start_scan", description: "Start an authorized VAPT scan.", parameters: { type: Type.OBJECT, properties: { scan_type: { type: Type.STRING }, targets: { type: Type.ARRAY, items: { type: Type.STRING } }, auth_scan: { type: Type.BOOLEAN }, window_start: { type: Type.STRING }, window_end: { type: Type.STRING } }, required: ["scan_type", "targets"] } },
    { name: "vapt_get_scan_status", description: "Get status.", parameters: { type: Type.OBJECT, properties: { scan_id: { type: Type.STRING } }, required: ["scan_id"] } },
    { name: "vapt_get_findings", description: "Get findings.", parameters: { type: Type.OBJECT, properties: { scan_id: { type: Type.STRING } }, required: ["scan_id"] } },
    { name: "vapt_stop_scan", description: "Stop scan.", parameters: { type: Type.OBJECT, properties: { scan_id: { type: Type.STRING } }, required: ["scan_id"] } },
    { name: "vapt_generate_report", description: "Generate report.", parameters: { type: Type.OBJECT, properties: { scan_id: { type: Type.STRING }, report_type: { type: Type.STRING }, format: { type: Type.STRING } }, required: ["scan_id"] } }
];

export const VaptOrchestratorPage: React.FC<VaptOrchestratorPageProps> = ({ permissions, addAuditLog, assets = [] }) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [scanConfig, setScanConfig] = useState({
        scope: '',
        scanType: 'infra_va',
        authScan: false,
        windowStart: new Date().toISOString().slice(0, 16),
        windowEnd: new Date(Date.now() + 3600 * 1000 * 4).toISOString().slice(0, 16),
    });
    
    // Agent State
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [scanData, setScanData] = useState<any>(null);
    const [findings, setFindings] = useState<VaptFinding[]>([]);
    const [agentInput, setAgentInput] = useState('');

    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-fill scope from navigation prop or manual selection
    useEffect(() => {
        // Check if we navigated here with a specific asset target (handled via route params normally, simulating here via state if needed)
        // For simplicity, we just have the asset dropdown available.
    }, []);

    const scrollToBottom = () => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; };
    useEffect(scrollToBottom, [messages]);

    const handleAuthorization = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAuthorized(e.target.checked);
        if (e.target.checked) addAuditLog('VAPT_SCAN_STARTED', 'User confirmed authorization for VAPT operations.');
    };

    const handleAddAssetToScope = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const assetId = e.target.value;
        if (!assetId) return;
        const asset = assets.find(a => a.id === assetId);
        if (asset && asset.ipAddress) {
            setScanConfig(prev => ({
                ...prev,
                scope: prev.scope ? `${prev.scope}, ${asset.ipAddress}` : asset.ipAddress
            }));
        }
    };

    const runAgentTurn = async (userMessageText: string) => {
        setIsThinking(true);
        try {
            const systemInstructionLocal = `You are "VAPT Orchestrator". Run authorized security testing for assets: ${scanConfig.scope}.`;
            const chatHistory = messages.map(m => ({ 
                role: m.role, 
                parts: [{ text: m.text }] 
            }));
            
            const chat = AIService.startChat({
                model: 'gemini-3-flash-preview',
                systemInstruction: systemInstructionLocal,
                history: chatHistory,
                tools: [{ functionDeclarations: tools }]
            });

            let response = await chat.sendMessage({ message: userMessageText });
            
            // Check for function calls
            const parts = response.candidates?.[0]?.content?.parts || [];
            const functionCallPart = parts.find(p => p.functionCall);
            
            if (functionCallPart?.functionCall) {
                const call = functionCallPart.functionCall;
                let toolResult;
                if (call.name === 'vapt_start_scan') toolResult = await mockStartScan(call.args);
                else if (call.name === 'vapt_get_scan_status') toolResult = await mockGetScanStatus(call.args as any);
                else if (call.name === 'vapt_get_findings') { toolResult = await mockGetFindings(call.args as any); if (toolResult.findings) setFindings(toolResult.findings); }
                else if (call.name === 'vapt_stop_scan') toolResult = await mockStopScan(call.args as any);
                else if (call.name === 'vapt_generate_report') toolResult = await mockGenerateReport(call.args as any);

                const nextResult = await chat.sendMessage({
                    message: [
                        {
                            functionResponse: {
                                name: call.name,
                                response: { result: toolResult }
                            }
                        }
                    ]
                });
                setMessages(prev => [...prev, { role: 'model', text: nextResult.text || "Action completed." }]);
                if (call.name === 'vapt_start_scan') setScanData(toolResult);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm not sure how to proceed." }]);
            }
        } catch (error: any) {
            console.error("VAPT Agent Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "System Error: Unable to complete VAPT operation." }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentInput.trim()) return;
        const text = agentInput;
        setAgentInput('');
        setMessages(prev => [...prev, { role: 'user', text }]);
        await runAgentTurn(text);
    };

    if (!permissions.has('vapt:manage')) {
        return <div className="text-center p-8"><h1 className="text-lg font-normal">Access Denied</h1></div>;
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <header className="flex-shrink-0">
                <h1 className="text-xl font-normal text-gray-900 dark:text-white flex items-center gap-3">
                    <BugAntIcon className="w-8 h-8 text-teal-500" />
                    VAPT Orchestrator
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Enterprise Vulnerability Assessment & Penetration Testing Automation</p>
            </header>

            {!isAuthorized && messages.length === 0 ? (
                <div className="flex-grow flex items-center justify-center">
                    <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-red-200 dark:border-red-900 p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
                            <div>
                                <h2 className="text-lg font-normal text-gray-900 dark:text-white">Authorization Required</h2>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                    Authorization is mandatory for automated security testing.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-normal text-gray-700 dark:text-gray-300">Target Scope</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        placeholder="e.g., 192.168.1.0/24"
                                        value={scanConfig.scope}
                                        onChange={(e) => setScanConfig({...scanConfig, scope: e.target.value})}
                                    />
                                    {assets.length > 0 && (
                                        <select 
                                            onChange={handleAddAssetToScope}
                                            className="mt-1 block w-1/3 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Add from Inventory...</option>
                                            {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.ipAddress})</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                            {/* ... (Other inputs remain similar) ... */}
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-900/50">
                            <input type="checkbox" id="authConfirm" checked={isAuthorized} onChange={handleAuthorization} className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                            <label htmlFor="authConfirm" className="text-sm font-normal text-red-800 dark:text-red-200">
                                I confirm I have written authorization from the asset owner to perform these tests.
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => {
                                    const prompt = `I confirm authorization for: ${scanConfig.scope}. Initiate ${scanConfig.scanType}.`;
                                    setMessages([{ role: 'user', text: prompt }]);
                                    runAgentTurn(prompt);
                                }}
                                disabled={!isAuthorized || !scanConfig.scope}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-normal rounded-md shadow-sm disabled:opacity-50 transition-colors"
                            >
                                Initialize VAPT Agent
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                    {/* Left: Chat / Orchestrator */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                            <h3 className="font-normal text-gray-800 dark:text-gray-200">Orchestrator Console</h3>
                            {scanData && <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">{scanData.status.toUpperCase()}</span>}
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-900 font-mono text-sm" ref={chatContainerRef}>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-white dark:bg-gray-800 ml-8 border border-gray-200 dark:border-gray-700' : 'bg-black text-green-400 mr-8'}`}>
                                    <span className="font-normal block mb-1 opacity-50 text-xs uppercase">{msg.role === 'user' ? 'Operator' : 'VAPT Agent'}</span>
                                    {msg.text}
                                </div>
                            ))}
                            {isThinking && <div className="text-gray-500 animate-pulse">Orchestrator is planning...</div>}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
                            <input type="text" value={agentInput} onChange={(e) => setAgentInput(e.target.value)} placeholder="Command the orchestrator..." className="flex-grow rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm" />
                            <button type="submit" disabled={isThinking} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50">Send</button>
                        </form>
                    </div>

                    {/* Right: Findings / Dashboard */}
                    <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex-grow">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <h3 className="font-normal text-gray-800 dark:text-gray-200">Live Findings</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Severity</th>
                                            <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Asset</th>
                                            <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vulnerability</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {findings.length === 0 ? (
                                            <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">No findings yet.</td></tr>
                                        ) : (
                                            findings.map((finding) => (
                                                <tr key={finding.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-normal rounded-full ${finding.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{finding.severity.toUpperCase()}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{finding.asset}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{finding.title}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
