import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
    ToggleLeft, 
    ToggleRight, 
    AlertTriangle, 
    Sliders,
    Zap,
    ShieldAlert,
    RefreshCw,
    Activity,
    Plus
} from 'lucide-react';

export type ToggleState = 'Enabled' | 'Read Only' | 'Hidden' | 'Disabled' | 'Archived';

export interface ToggleItem {
    id: string;
    category: string;
    name: string;
    state: ToggleState;
    desc: string;
}

export interface KillSwitchItem {
    id: string;
    name: string;
    isArmed: boolean;
    desc: string;
    impactLevel: string;
}

interface ControlPlaneTogglesProps {
    addAuditLog: (action: string, details: string) => void;
}

const initialToggles: ToggleItem[] = [
    { id: 'grc', category: 'Module Toggles', name: 'Governance & Compliance Registry', state: 'Enabled', desc: 'Central governance & compliance registry lifecycle' },
    { id: 'risk', category: 'Module Toggles', name: 'Risk Management Pipeline', state: 'Enabled', desc: 'Active corporate risk registry' },
    { id: 'audit', category: 'Module Toggles', name: 'Audit & Findings Module', state: 'Enabled', desc: 'Comprehensive internal audit workflow' },
    { id: 'ai_gov', category: 'Module Toggles', name: 'AI Governance Suite', state: 'Enabled', desc: 'Controls for managing enterprise LLM security' },
    
    { id: 'export', category: 'Feature Toggles', name: 'Excel/PDF Content Export', state: 'Enabled', desc: 'Allows compliance sheets and findings to be exported offline' },
    { id: 'import', category: 'Feature Toggles', name: 'Evidence Content Import', state: 'Enabled', desc: 'Permits bulk uploading of CSV assessment points' },
    { id: 'delete', category: 'Feature Toggles', name: 'Destructive Record Deletion', state: 'Enabled', desc: 'Binds permissions for deleting logs, policies and checklists' },
    
    { id: 'ai_chat', category: 'AI Toggles', name: 'Generative AI Advisor Chat', state: 'Enabled', desc: 'Interactive chat widget with local fallback intelligence' },
    { id: 'ai_agents', category: 'AI Toggles', name: 'Simulated AI Department Agents', state: 'Enabled', desc: 'Multi-agent simulation and automated delegate engine' },
    { id: 'ai_risk', category: 'AI Toggles', name: 'AI Risk Assessments Analyzer', state: 'Enabled', desc: 'Enables automatic text classification of risk vectors' },
    
    { id: 'sap', category: 'Integration Toggles', name: 'SAP GRC Sync Integration', state: 'Disabled', desc: 'Direct secure API link to SAP databases' },
    { id: 'm365', category: 'Integration Toggles', name: 'Microsoft 365 Policy Connector', state: 'Enabled', desc: 'Reads documents directly from OneDrive corporate folders' },
    { id: 'jira', category: 'Integration Toggles', name: 'Jira Compliance Ticketing', state: 'Enabled', desc: 'Triggers Jira issues when audit points fail' }
];

const initialKillSwitches: KillSwitchItem[] = [
    { id: 'platform_core', name: 'Global Platform Control Plane', isArmed: false, desc: 'Brings down all server APIs, web gateways, and workspace logins immediately.', impactLevel: 'Critical' },
    { id: 'ai_engine', name: 'AI Inference Engines Pipeline', isArmed: false, desc: 'Terminates all server-side Gemini, LLM embeddings, and agent orchestration calls.', impactLevel: 'High' },
    { id: 'external_integrations', name: 'External Integrations Webhooks', isArmed: false, desc: 'Closes all external sync links, active webhooks, and REST sync lines.', impactLevel: 'Medium' },
    { id: 'user_auth_routes', name: 'User Authentication APIs', isArmed: false, desc: 'Blocks any new logins, tokens, and registration pipelines immediately.', impactLevel: 'High' }
];

export const ControlPlaneToggles: React.FC<ControlPlaneTogglesProps> = ({ addAuditLog }) => {
    const [subTab, setSubTab] = useState<'toggles' | 'emergency'>('toggles');

    // Toggles state
    const [toggles, setToggles] = useState<ToggleItem[]>(() => {
        const saved = localStorage.getItem('control_plane_toggles');
        return saved ? JSON.parse(saved) : initialToggles;
    });

    // Kill switches state
    const [killSwitches, setKillSwitches] = useState<KillSwitchItem[]>(() => {
        const saved = localStorage.getItem('control_plane_killswitches');
        return saved ? JSON.parse(saved) : initialKillSwitches;
    });

    // New Toggle form
    const [newToggle, setNewToggle] = useState({ id: '', category: 'Module Toggles', name: '', state: 'Enabled' as ToggleState, desc: '' });

    const saveTogglesToDb = async (updated: ToggleItem[]) => {
        setToggles(updated);
        localStorage.setItem('control_plane_toggles', JSON.stringify(updated));
        try {
            await setDoc(doc(db, 'system_control_plane', 'universal_toggles'), { items: updated }, { merge: true });
        } catch (e) {
            console.warn("Firestore offline fallback: saved universal toggles locally.");
        }
    };

    const saveKillSwitchesToDb = async (updated: KillSwitchItem[]) => {
        setKillSwitches(updated);
        localStorage.setItem('control_plane_killswitches', JSON.stringify(updated));
        try {
            await setDoc(doc(db, 'system_control_plane', 'emergency_switches'), { items: updated }, { merge: true });
        } catch (e) {
            console.warn("Firestore offline fallback: saved killswitches locally.");
        }
    };

    const handleCycleToggleState = (id: string) => {
        const states: ToggleState[] = ['Enabled', 'Read Only', 'Hidden', 'Disabled', 'Archived'];
        const updated = toggles.map(t => {
            if (t.id === id) {
                const curIdx = states.indexOf(t.state);
                const nextState = states[(curIdx + 1) % states.length];
                addAuditLog("CYCLE_UNIVERSAL_TOGGLE", `Cycled state for toggle ${t.name} from ${t.state} to ${nextState}`);
                return { ...t, state: nextState };
            }
            return t;
        });
        saveTogglesToDb(updated);
    };

    const handleSetSpecificState = (id: string, newState: ToggleState) => {
        const updated = toggles.map(t => {
            if (t.id === id) {
                addAuditLog("SET_UNIVERSAL_TOGGLE", `Set state for toggle ${t.name} to ${newState}`);
                return { ...t, state: newState };
            }
            return t;
        });
        saveTogglesToDb(updated);
    };

    const handleAddCustomToggle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newToggle.id || !newToggle.name) return;
        const item: ToggleItem = {
            id: newToggle.id.toLowerCase().trim(),
            category: newToggle.category,
            name: newToggle.name,
            state: newToggle.state,
            desc: newToggle.desc || 'Custom administrator toggle node'
        };
        const updated = [...toggles, item];
        saveTogglesToDb(updated);
        addAuditLog("CREATE_UNIVERSAL_TOGGLE", `Added custom toggle switch ${item.name} under ${item.category}`);
        setNewToggle({ id: '', category: 'Module Toggles', name: '', state: 'Enabled', desc: '' });
    };

    const handleDeleteToggle = (id: string) => {
        if (!confirm("Remove this toggle switch from system orchestrator?")) return;
        const target = toggles.find(t => t.id === id);
        const updated = toggles.filter(t => t.id !== id);
        saveTogglesToDb(updated);
        if (target) {
            addAuditLog("DELETE_UNIVERSAL_TOGGLE", `Removed toggle switch ${target.name}`);
        }
    };

    // Emergency Kill Switch trigger
    const handleTriggerKillSwitch = (id: string) => {
        const target = killSwitches.find(ks => ks.id === id);
        if (!target) return;
        const nextState = !target.isArmed;

        const confirmationMsg = nextState 
            ? `🔴 WARNING: You are about to ACTIVATE the kill switch for "${target.name}". This will immediately disrupt systems. Proceed?`
            : `🟢 You are about to disarm the kill switch for "${target.name}". This will restore operations. Proceed?`;

        if (!confirm(confirmationMsg)) return;

        const updated = killSwitches.map(ks => {
            if (ks.id === id) {
                return { ...ks, isArmed: nextState };
            }
            return ks;
        });
        saveKillSwitchesToDb(updated);
        addAuditLog("TRIGGER_EMERGENCY_KILL_SWITCH", `${nextState ? 'ACTIVATED' : 'DISARMED'} emergency kill switch for ${target.name}`);
    };

    // State helper for colored flags
    const getBadgeClass = (state: ToggleState) => {
        switch (state) {
            case 'Enabled': return 'bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-950/20 dark:text-emerald-400';
            case 'Read Only': return 'bg-amber-50 text-amber-700 border-amber-150 dark:bg-amber-950/20 dark:text-amber-400';
            case 'Hidden': return 'bg-orange-50 text-orange-700 border-orange-150 dark:bg-orange-950/20 dark:text-orange-400';
            case 'Disabled': return 'bg-rose-50 text-rose-700 border-rose-150 dark:bg-rose-950/20 dark:text-rose-400';
            case 'Archived': return 'bg-gray-100 text-gray-500 border-gray-250 dark:bg-gray-900';
        }
    };

    return (
        <div className="space-y-4">
            {/* Sub Tabs switcher */}
            <div className="flex border-b border-gray-150 dark:border-gray-800 gap-4 pb-2">
                <button onClick={() => setSubTab('toggles')} className={`text-xs uppercase tracking-wider pb-1 transition-all ${subTab === 'toggles' ? 'text-teal-600 border-b-2 border-teal-500 font-medium' : 'text-gray-400 hover:text-gray-600 font-normal'}`}>Universal Toggle Engine</button>
                <button onClick={() => setSubTab('emergency')} className={`text-xs uppercase tracking-wider pb-1 transition-all ${subTab === 'emergency' ? 'text-teal-600 border-b-2 border-teal-500 font-medium' : 'text-gray-400 hover:text-gray-600 font-normal'}`}>Emergency Control Center</button>
            </div>

            {/* A. UNIVERSAL TOGGLE MATRIX */}
            {subTab === 'toggles' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add toggle switch form */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 p-4 rounded-xl space-y-4 self-start">
                        <h3 className="text-xs font-normal text-gray-500 uppercase tracking-widest block mb-2">Register Custom Orchestrator Toggle</h3>
                        <form onSubmit={handleAddCustomToggle} className="space-y-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Toggle Key ID (Unique)</label>
                                <input type="text" required placeholder="e.g. sidebar_audit_tab" value={newToggle.id} onChange={e => setNewToggle({ ...newToggle, id: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500 font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Functional Label</label>
                                <input type="text" required placeholder="e.g. Audit Findings Visibility Toggle" value={newToggle.name} onChange={e => setNewToggle({ ...newToggle, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Category Group</label>
                                <select value={newToggle.category} onChange={e => setNewToggle({ ...newToggle, category: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500">
                                    <option value="Module Toggles">Module Toggles</option>
                                    <option value="Feature Toggles">Feature Toggles</option>
                                    <option value="Menu Toggles">Menu Toggles</option>
                                    <option value="Framework Toggles">Framework Toggles</option>
                                    <option value="AI Toggles">AI Toggles</option>
                                    <option value="Integration Toggles">Integration Toggles</option>
                                    <option value="Customer Toggles">Customer Toggles</option>
                                    <option value="User Toggles">User Toggles</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Default Runtime State</label>
                                <select value={newToggle.state} onChange={e => setNewToggle({ ...newToggle, state: e.target.value as ToggleState })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500">
                                    <option value="Enabled">🟢 Enabled</option>
                                    <option value="Read Only">🟡 Read Only</option>
                                    <option value="Hidden">🟠 Hidden</option>
                                    <option value="Disabled">🔴 Disabled</option>
                                    <option value="Archived">⚫ Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Functional explanation</label>
                                <textarea rows={2} placeholder="Impact of cycling or disabling this toggle..." value={newToggle.desc} onChange={e => setNewToggle({ ...newToggle, desc: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500" />
                            </div>
                            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 rounded font-normal uppercase tracking-wider transition-all">Register Custom Toggle</button>
                        </form>
                    </div>

                    {/* Universal Toggle matrix list */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden self-start">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xs font-normal text-gray-500 uppercase tracking-widest">Orchestrator Universal Toggle Matrix</h3>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-normal">Total nodes: {toggles.length}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800 text-gray-500">
                                    <tr>
                                        <th className="p-3 font-normal uppercase tracking-wider font-sans">Configuration Switch</th>
                                        <th className="p-3 font-normal uppercase tracking-wider">Group Category</th>
                                        <th className="p-3 font-normal uppercase tracking-wider text-center">Runtime State</th>
                                        <th className="p-3 font-normal uppercase tracking-wider text-right font-sans">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {toggles.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-all font-normal">
                                            <td className="p-3 font-sans">
                                                <span className="font-normal text-gray-900 dark:text-gray-100 block">{t.name}</span>
                                                <span className="font-mono text-[9px] text-gray-400 block uppercase">Key: {t.id} — {t.desc}</span>
                                            </td>
                                            <td className="p-3 uppercase text-[10px] text-teal-600 dark:text-teal-400">
                                                {t.category}
                                            </td>
                                            <td className="p-3 text-center">
                                                <select value={t.state} onChange={e => handleSetSpecificState(t.id, e.target.value as ToggleState)} className={`px-2 py-1 rounded text-[10px] border font-sans outline-none cursor-pointer ${getBadgeClass(t.state)}`}>
                                                    <option value="Enabled">Enabled</option>
                                                    <option value="Read Only">Read Only</option>
                                                    <option value="Hidden">Hidden</option>
                                                    <option value="Disabled">Disabled</option>
                                                    <option value="Archived">Archived</option>
                                                </select>
                                            </td>
                                            <td className="p-3 text-right font-sans">
                                                <button onClick={() => handleDeleteToggle(t.id)} className="px-2 py-0.5 hover:bg-rose-50 text-rose-500 rounded text-xs transition-all">Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* B. EMERGENCY CONTROL CENTER */}
            {subTab === 'emergency' && (
                <div className="space-y-6">
                    <div className="bg-rose-50/40 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4 flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs text-rose-800 dark:text-rose-400">
                            <h4 className="font-medium uppercase tracking-wider text-rose-900 dark:text-rose-200">INTERNAL EXECUTIVE MASTER KILL GATEWAYS</h4>
                            <p className="font-normal leading-relaxed">
                                The Master Kill switches below override database rules and sever API lines instantaneously across the SaaS platform cluster. Turning on these controls causes immediate downstream system lockouts, offline local fallback, or pipeline termination for tenant corporations. Ensure dual authorization is met before deploying a kill sequence.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {killSwitches.map(ks => (
                            <div key={ks.id} className={`p-5 rounded-xl border transition-all flex justify-between items-start ${ks.isArmed ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800'}`}>
                                <div className="space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <h4 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">{ks.name}</h4>
                                        <span className={`text-[9px] uppercase font-normal px-2 py-0.5 rounded border ${ks.isArmed ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-gray-100 text-gray-500 border-gray-250 dark:bg-gray-900'}`}>
                                            {ks.isArmed ? '🔴 ACTIVATED / SHUTDOWN' : '🟢 ARMED / DEPLOYED'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Severity impact: <span className="text-rose-600">{ks.impactLevel}</span></p>
                                    <p className="text-xs text-gray-500 leading-normal">{ks.desc}</p>
                                </div>
                                <div className="ml-4 shrink-0">
                                    <button 
                                        onClick={() => handleTriggerKillSwitch(ks.id)}
                                        className={`px-4 py-2 text-xs font-normal uppercase tracking-wider rounded border transition-all ${ks.isArmed ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500' : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500'}`}
                                    >
                                        {ks.isArmed ? 'DISARM / RE-ENABLE' : 'EXECUTE SHUTDOWN'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
