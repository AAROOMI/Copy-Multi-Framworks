import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
    Zap, 
    RefreshCw, 
    Trash2, 
    Plus, 
    Shield, 
    Sliders,
    Layers,
    FileText,
    Copy,
    Activity
} from 'lucide-react';

interface ModuleItem {
    moduleId: string;
    name: string;
    version: string;
    status: string;
    enabled: boolean;
    billingModel: string;
    createdBy: string;
    createdAt: string;
}

interface FrameworkItem {
    id: string;
    name: string;
    version: string;
    status: string;
    mappedControlsCount: number;
    description: string;
}

interface FeatureItem {
    id: string;
    moduleId: string;
    name: string;
    enabled: boolean;
    status: string;
}

interface ControlPlaneModulesProps {
    addAuditLog: (action: string, details: string) => void;
}

const initialModules: ModuleItem[] = [
    { moduleId: 'grc', name: 'GRC', version: '1.4.0', status: 'Active', enabled: true, billingModel: 'Subscription', createdBy: 'System', createdAt: '2026-01-10' },
    { moduleId: 'compliance', name: 'Compliance', version: '2.1.2', status: 'Active', enabled: true, billingModel: 'Seat-based', createdBy: 'System', createdAt: '2026-01-10' },
    { moduleId: 'risk', name: 'Risk Management', version: '1.8.5', status: 'Active', enabled: true, billingModel: 'Consumption-based', createdBy: 'System', createdAt: '2026-01-15' },
    { moduleId: 'audit', name: 'Audit Management', version: '1.3.0', status: 'Active', enabled: true, billingModel: 'Subscription', createdBy: 'System', createdAt: '2026-01-20' },
    { moduleId: 'vendor', name: 'Vendor Management', version: '1.1.2', status: 'Beta', enabled: true, billingModel: 'Subscription', createdBy: 'System', createdAt: '2026-02-01' },
    { moduleId: 'asset', name: 'Asset Management', version: '1.5.0', status: 'Active', enabled: true, billingModel: 'Pay-as-you-go', createdBy: 'System', createdAt: '2026-02-10' },
    { moduleId: 'incident', name: 'Incident Management', version: '2.0.1', status: 'Active', enabled: true, billingModel: 'Pay-as-you-go', createdBy: 'System', createdAt: '2026-02-15' },
    { moduleId: 'bc', name: 'Business Continuity', version: '1.0.4', status: 'Beta', enabled: true, billingModel: 'Enterprise', createdBy: 'System', createdAt: '2026-03-01' },
    { moduleId: 'ai_governance', name: 'AI Governance', version: '2.4.0', status: 'Active', enabled: true, billingModel: 'Consumption-based', createdBy: 'System', createdAt: '2026-03-05' },
    { moduleId: 'ai_agents', name: 'AI Agents', version: '3.2.1', status: 'Active', enabled: true, billingModel: 'Consumption-based', createdBy: 'System', createdAt: '2026-03-10' },
    { moduleId: 'ai_workflows', name: 'AI Workflows', version: '1.5.2', status: 'Beta', enabled: true, billingModel: 'Consumption-based', createdBy: 'System', createdAt: '2026-03-15' },
    { moduleId: 'reporting', name: 'Reporting', version: '1.2.0', status: 'Active', enabled: true, billingModel: 'Freemium', createdBy: 'System', createdAt: '2026-03-20' },
    { moduleId: 'analytics', name: 'Analytics', version: '1.3.1', status: 'Active', enabled: true, billingModel: 'Freemium', createdBy: 'System', createdAt: '2026-03-25' },
    { moduleId: 'integrations', name: 'Integrations', version: '2.0.0', status: 'Active', enabled: true, billingModel: 'Enterprise', createdBy: 'System', createdAt: '2026-04-01' },
    { moduleId: 'billing', name: 'Billing', version: '1.1.0', status: 'Active', enabled: true, billingModel: 'Free', createdBy: 'System', createdAt: '2026-04-05' },
    { moduleId: 'licensing', name: 'Licensing', version: '1.1.0', status: 'Active', enabled: true, billingModel: 'Free', createdBy: 'System', createdAt: '2026-04-10' },
    { moduleId: 'administration', name: 'Administration', version: '1.0.0', status: 'Active', enabled: true, billingModel: 'Free', createdBy: 'System', createdAt: '2026-04-15' }
];

const initialFrameworks: FrameworkItem[] = [
    { id: 'ecc', name: 'NCA ECC', version: '2018', status: 'Active', mappedControlsCount: 114, description: 'National Cybersecurity Authority Essential Cybersecurity Controls' },
    { id: 'cscc', name: 'NCA CSCC', version: '2019', status: 'Active', mappedControlsCount: 38, description: 'National Cybersecurity Authority Critical Systems Cybersecurity Controls' },
    { id: 'sama', name: 'SAMA CSF', version: '3.5', status: 'Active', mappedControlsCount: 52, description: 'Saudi Central Bank Cybersecurity Framework' },
    { id: 'pdpl', name: 'PDPL', version: '2023', status: 'Active', mappedControlsCount: 22, description: 'Saudi Personal Data Protection Law' },
    { id: 'iso27001', name: 'ISO 27001', version: '2022', status: 'Active', mappedControlsCount: 93, description: 'Information Security Management Systems' },
    { id: 'iso22301', name: 'ISO 22301', version: '2019', status: 'Active', mappedControlsCount: 45, description: 'Business Continuity Management Systems' },
    { id: 'iso31000', name: 'ISO 31000', version: '2018', status: 'Active', mappedControlsCount: 10, description: 'Risk Management Guidelines' },
    { id: 'nist_csf', name: 'NIST CSF', version: '2.0', status: 'Active', mappedControlsCount: 108, description: 'NIST Cybersecurity Framework' },
    { id: 'nist_ai', name: 'NIST AI RMF', version: '1.0', status: 'Beta', mappedControlsCount: 32, description: 'Artificial Intelligence Risk Management Framework' },
    { id: 'cobit', name: 'COBIT', version: '2019', status: 'Deprecated', mappedControlsCount: 40, description: 'Control Objectives for Information and Related Technology' },
    { id: 'soc2', name: 'SOC 2', version: '2020', status: 'Active', mappedControlsCount: 85, description: 'System and Organization Controls 2' },
    { id: 'cis', name: 'CIS Controls', version: '8', status: 'Active', mappedControlsCount: 153, description: 'Center for Internet Security Controls' }
];

const initialFeatures: FeatureItem[] = [
    { id: 'feat-risk-reg', moduleId: 'risk', name: 'Risk Register', enabled: true, status: 'Active' },
    { id: 'feat-risk-assess', moduleId: 'risk', name: 'Risk Assessment', enabled: true, status: 'Active' },
    { id: 'feat-risk-heatmap', moduleId: 'risk', name: 'Risk Heatmap', enabled: true, status: 'Active' },
    { id: 'feat-risk-analytics', moduleId: 'risk', name: 'Risk Analytics', enabled: true, status: 'Active' },
    { id: 'feat-audit-plan', moduleId: 'audit', name: 'Audit Planning', enabled: true, status: 'Active' },
    { id: 'feat-audit-exec', moduleId: 'audit', name: 'Audit Execution', enabled: true, status: 'Active' },
    { id: 'feat-audit-find', moduleId: 'audit', name: 'Findings Registry', enabled: true, status: 'Active' },
    { id: 'feat-audit-capa', moduleId: 'audit', name: 'CAPA Corrective Actions', enabled: true, status: 'Active' },
    { id: 'feat-ai-chat', moduleId: 'ai_agents', name: 'AI Expert Advisor Chat', enabled: true, status: 'Active' },
    { id: 'feat-ai-auditor', moduleId: 'ai_agents', name: 'Continuous AI Compliance Auditor', enabled: true, status: 'Active' },
    { id: 'feat-ai-analyst', moduleId: 'ai_agents', name: 'Autonomous Security Analyst Agent', enabled: true, status: 'Active' }
];

export const ControlPlaneModules: React.FC<ControlPlaneModulesProps> = ({ addAuditLog }) => {
    const [subTab, setSubTab] = useState<'modules' | 'frameworks' | 'features'>('modules');
    
    // Modules State
    const [modules, setModules] = useState<ModuleItem[]>(() => {
        const saved = localStorage.getItem('control_plane_modules');
        return saved ? JSON.parse(saved) : initialModules;
    });

    // Frameworks State
    const [frameworks, setFrameworks] = useState<FrameworkItem[]>(() => {
        const saved = localStorage.getItem('control_plane_frameworks');
        return saved ? JSON.parse(saved) : initialFrameworks;
    });

    // Features State
    const [features, setFeatures] = useState<FeatureItem[]>(() => {
        const saved = localStorage.getItem('control_plane_features');
        return saved ? JSON.parse(saved) : initialFeatures;
    });

    // Forms states
    const [moduleForm, setModuleForm] = useState({ moduleId: '', name: '', version: '1.0.0', billingModel: 'Subscription', status: 'Active' });
    const [frameworkForm, setFrameworkForm] = useState({ id: '', name: '', version: '1.0', status: 'Active', mappedControlsCount: 0, description: '' });
    const [featureForm, setFeatureForm] = useState({ id: '', moduleId: 'grc', name: '', status: 'Active' });

    const saveModulesToDb = async (updated: ModuleItem[]) => {
        setModules(updated);
        localStorage.setItem('control_plane_modules', JSON.stringify(updated));
        try {
            await setDoc(doc(db, 'system_control_plane', 'modules_registry'), { items: updated }, { merge: true });
        } catch (e) {
            console.warn("Firestore offline fallback: saved modules locally.");
        }
    };

    const saveFrameworksToDb = async (updated: FrameworkItem[]) => {
        setFrameworks(updated);
        localStorage.setItem('control_plane_frameworks', JSON.stringify(updated));
        try {
            await setDoc(doc(db, 'system_control_plane', 'frameworks_registry'), { items: updated }, { merge: true });
        } catch (e) {
            console.warn("Firestore offline fallback: saved frameworks locally.");
        }
    };

    const saveFeaturesToDb = async (updated: FeatureItem[]) => {
        setFeatures(updated);
        localStorage.setItem('control_plane_features', JSON.stringify(updated));
        try {
            await setDoc(doc(db, 'system_control_plane', 'features_registry'), { items: updated }, { merge: true });
        } catch (e) {
            console.warn("Firestore offline fallback: saved features locally.");
        }
    };

    // Modules Registry Core Operations
    const handleAddModule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!moduleForm.moduleId || !moduleForm.name) return;
        const newMod: ModuleItem = {
            moduleId: moduleForm.moduleId.toLowerCase().trim(),
            name: moduleForm.name,
            version: moduleForm.version,
            status: moduleForm.status,
            enabled: true,
            billingModel: moduleForm.billingModel,
            createdBy: 'Super Admin',
            createdAt: new Date().toLocaleDateString()
        };
        const updated = [...modules, newMod];
        saveModulesToDb(updated);
        addAuditLog("CREATE_MODULE", `Installed module ${newMod.name} (v${newMod.version})`);
        setModuleForm({ moduleId: '', name: '', version: '1.0.0', billingModel: 'Subscription', status: 'Active' });
    };

    const handleUpgradeModule = (moduleId: string) => {
        const updated = modules.map(m => {
            if (m.moduleId === moduleId) {
                const parts = m.version.split('.').map(Number);
                if (parts.length === 3) parts[1] += 1; // minor version upgrade
                const newVer = parts.join('.');
                addAuditLog("UPGRADE_MODULE", `Upgraded module ${m.name} to v${newVer}`);
                return { ...m, version: newVer };
            }
            return m;
        });
        saveModulesToDb(updated);
    };

    const handleDowngradeModule = (moduleId: string) => {
        const updated = modules.map(m => {
            if (m.moduleId === moduleId) {
                const parts = m.version.split('.').map(Number);
                if (parts.length === 3 && parts[1] > 0) parts[1] -= 1; // minor version downgrade
                const newVer = parts.join('.');
                addAuditLog("DOWNGRADE_MODULE", `Downgraded module ${m.name} to v${newVer}`);
                return { ...m, version: newVer };
            }
            return m;
        });
        saveModulesToDb(updated);
    };

    const handleToggleModuleActive = (moduleId: string) => {
        const updated = modules.map(m => {
            if (m.moduleId === moduleId) {
                const nextState = !m.enabled;
                addAuditLog("TOGGLE_MODULE_STATE", `${nextState ? 'Activated' : 'Deactivated'} module ${m.name}`);
                return { ...m, enabled: nextState };
            }
            return m;
        });
        saveModulesToDb(updated);
    };

    const handleDeleteModule = (moduleId: string) => {
        if (!confirm("Are you sure you want to uninstall and remove this module from system configuration registries?")) return;
        const target = modules.find(m => m.moduleId === moduleId);
        const updated = modules.filter(m => m.moduleId !== moduleId);
        saveModulesToDb(updated);
        if (target) {
            addAuditLog("UNINSTALL_MODULE", `Uninstalled module ${target.name}`);
        }
    };

    // Frameworks Registry Operations
    const handleAddFramework = (e: React.FormEvent) => {
        e.preventDefault();
        if (!frameworkForm.id || !frameworkForm.name) return;
        const newFrame: FrameworkItem = {
            id: frameworkForm.id.toLowerCase().trim(),
            name: frameworkForm.name,
            version: frameworkForm.version,
            status: frameworkForm.status,
            mappedControlsCount: Number(frameworkForm.mappedControlsCount) || 10,
            description: frameworkForm.description || 'Custom corporate framework'
        };
        const updated = [...frameworks, newFrame];
        saveFrameworksToDb(updated);
        addAuditLog("CREATE_FRAMEWORK", `Registered framework ${newFrame.name} (v${newFrame.version})`);
        setFrameworkForm({ id: '', name: '', version: '1.0', status: 'Active', mappedControlsCount: 0, description: '' });
    };

    const handleCloneFramework = (f: FrameworkItem) => {
        const cloned: FrameworkItem = {
            ...f,
            id: `${f.id}_copy_${Math.floor(Math.random()*1000)}`,
            name: `${f.name} (Clone)`,
            description: `Cloned snapshot from ${f.name}. ${f.description}`
        };
        const updated = [...frameworks, cloned];
        saveFrameworksToDb(updated);
        addAuditLog("CLONE_FRAMEWORK", `Cloned framework ${f.name} into ${cloned.name}`);
    };

    const handleArchiveFramework = (id: string) => {
        const updated = frameworks.map(f => {
            if (f.id === id) {
                const nextStatus = f.status === 'Archived' ? 'Active' : 'Archived';
                addAuditLog("ARCHIVE_FRAMEWORK", `Status modified for framework ${f.name} to ${nextStatus}`);
                return { ...f, status: nextStatus };
            }
            return f;
        });
        saveFrameworksToDb(updated);
    };

    const handleDeleteFramework = (id: string) => {
        if (!confirm("Are you sure you want to permanently delete this compliance framework mapping? This is irreversible.")) return;
        const target = frameworks.find(f => f.id === id);
        const updated = frameworks.filter(f => f.id !== id);
        saveFrameworksToDb(updated);
        if (target) {
            addAuditLog("DELETE_FRAMEWORK", `Deleted framework ${target.name}`);
        }
    };

    // Features Registry Operations
    const handleAddFeature = (e: React.FormEvent) => {
        e.preventDefault();
        if (!featureForm.id || !featureForm.name) return;
        const newFeat: FeatureItem = {
            id: featureForm.id.toLowerCase().trim(),
            moduleId: featureForm.moduleId,
            name: featureForm.name,
            enabled: true,
            status: featureForm.status
        };
        const updated = [...features, newFeat];
        saveFeaturesToDb(updated);
        addAuditLog("CREATE_FEATURE", `Registered feature ${newFeat.name} under module ${newFeat.moduleId}`);
        setFeatureForm({ id: '', moduleId: 'grc', name: '', status: 'Active' });
    };

    const handleToggleFeature = (id: string) => {
        const updated = features.map(f => {
            if (f.id === id) {
                const nextState = !f.enabled;
                addAuditLog("TOGGLE_FEATURE", `${nextState ? 'Enabled' : 'Disabled'} feature ${f.name}`);
                return { ...f, enabled: nextState };
            }
            return f;
        });
        saveFeaturesToDb(updated);
    };

    const handleDeleteFeature = (id: string) => {
        if (!confirm("Confirm removal of this module feature?")) return;
        const target = features.find(f => f.id === id);
        const updated = features.filter(f => f.id !== id);
        saveFeaturesToDb(updated);
        if (target) {
            addAuditLog("DELETE_FEATURE", `Removed feature ${target.name}`);
        }
    };

    return (
        <div className="space-y-4">
            {/* Sub-tabs switch */}
            <div className="flex border-b border-gray-150 dark:border-gray-800 gap-4 pb-2">
                <button onClick={() => setSubTab('modules')} className={`text-xs uppercase tracking-wider pb-1 transition-all ${subTab === 'modules' ? 'text-teal-600 border-b-2 border-teal-500 font-medium' : 'text-gray-400 hover:text-gray-600 font-normal'}`}>Module Registry</button>
                <button onClick={() => setSubTab('frameworks')} className={`text-xs uppercase tracking-wider pb-1 transition-all ${subTab === 'frameworks' ? 'text-teal-600 border-b-2 border-teal-500 font-medium' : 'text-gray-400 hover:text-gray-600 font-normal'}`}>Framework Registry</button>
                <button onClick={() => setSubTab('features')} className={`text-xs uppercase tracking-wider pb-1 transition-all ${subTab === 'features' ? 'text-teal-600 border-b-2 border-teal-500 font-medium' : 'text-gray-400 hover:text-gray-600 font-normal'}`}>Feature Registry</button>
            </div>

            {/* A. MODULES REGISTRY */}
            {subTab === 'modules' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add form */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 p-4 rounded-xl space-y-4 self-start">
                        <h3 className="text-xs font-normal text-gray-500 uppercase tracking-widest block mb-2">Register Custom Capability Module</h3>
                        <form onSubmit={handleAddModule} className="space-y-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Module ID (Unique)</label>
                                <input type="text" required placeholder="e.g. bcm_v2" value={moduleForm.moduleId} onChange={e => setModuleForm({ ...moduleForm, moduleId: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500 font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Module Name</label>
                                <input type="text" required placeholder="e.g. Business Continuity Manager" value={moduleForm.name} onChange={e => setModuleForm({ ...moduleForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Version</label>
                                    <input type="text" required placeholder="1.0.0" value={moduleForm.version} onChange={e => setModuleForm({ ...moduleForm, version: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500 font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Status</label>
                                    <select value={moduleForm.status} onChange={e => setModuleForm({ ...moduleForm, status: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500">
                                        <option value="Active">Active</option>
                                        <option value="Beta">Beta</option>
                                        <option value="Deprecated">Deprecated</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Monetization Billing Model</label>
                                <select value={moduleForm.billingModel} onChange={e => setModuleForm({ ...moduleForm, billingModel: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500">
                                    <option value="Subscription">Subscription</option>
                                    <option value="Pay-as-you-go">Pay-as-you-go</option>
                                    <option value="Seat-based">Seat-based</option>
                                    <option value="Consumption-based">Consumption-based</option>
                                    <option value="Enterprise">Enterprise</option>
                                    <option value="Free">Free</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 rounded font-normal uppercase tracking-wider transition-all">Install Module Node</button>
                        </form>
                    </div>

                    {/* Modules registry list table */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden self-start">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-xs font-normal text-gray-500 uppercase tracking-widest">Active Dynamic Modules Database</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800 text-gray-500">
                                    <tr>
                                        <th className="p-3 font-normal uppercase tracking-wider">Module ID / Name</th>
                                        <th className="p-3 font-normal uppercase tracking-wider text-center">Version</th>
                                        <th className="p-3 font-normal uppercase tracking-wider">Billing Model</th>
                                        <th className="p-3 font-normal uppercase tracking-wider text-center">Status</th>
                                        <th className="p-3 font-normal uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {modules.map(m => (
                                        <tr key={m.moduleId} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-all font-normal">
                                            <td className="p-3">
                                                <span className="font-normal text-gray-900 dark:text-gray-100 block">{m.name}</span>
                                                <span className="font-mono text-[9px] text-gray-400 block uppercase">ID: {m.moduleId}</span>
                                            </td>
                                            <td className="p-3 text-center font-mono text-gray-600 dark:text-gray-300">
                                                v{m.version}
                                            </td>
                                            <td className="p-3">
                                                <span className="px-1.5 py-0.5 rounded text-[10px] border border-teal-100 bg-teal-50/20 text-teal-600 dark:border-teal-900/30 dark:text-teal-400">{m.billingModel}</span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleToggleModuleActive(m.moduleId)} className={`px-2 py-0.5 rounded text-[9px] uppercase border transition-all ${m.enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-900'}`}>
                                                    {m.enabled ? m.status : 'Disabled'}
                                                </button>
                                            </td>
                                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                                <button onClick={() => handleUpgradeModule(m.moduleId)} title="Upgrade Version" className="px-1.5 py-0.5 text-[9px] bg-gray-50 border border-gray-200 text-gray-500 rounded hover:bg-teal-50 hover:text-teal-600 transition-all">Up</button>
                                                <button onClick={() => handleDowngradeModule(m.moduleId)} title="Downgrade Version" className="px-1.5 py-0.5 text-[9px] bg-gray-50 border border-gray-200 text-gray-500 rounded hover:bg-amber-50 hover:text-amber-600 transition-all">Down</button>
                                                <button onClick={() => handleDeleteModule(m.moduleId)} className="px-1.5 py-0.5 text-[9px] hover:bg-rose-50 text-rose-500 rounded transition-all">Del</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* B. FRAMEWORKS REGISTRY */}
            {subTab === 'frameworks' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add framework form */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 p-4 rounded-xl space-y-4 self-start">
                        <h3 className="text-xs font-normal text-gray-500 uppercase tracking-widest block mb-2">Configure GRC Framework Schema</h3>
                        <form onSubmit={handleAddFramework} className="space-y-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Framework ID (Unique)</label>
                                <input type="text" required placeholder="e.g. nca_ecc" value={frameworkForm.id} onChange={e => setFrameworkForm({ ...frameworkForm, id: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500 font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Official Standard Name</label>
                                <input type="text" required placeholder="e.g. NCA ECC (Essential controls)" value={frameworkForm.name} onChange={e => setFrameworkForm({ ...frameworkForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Standard Year/Ver</label>
                                    <input type="text" required placeholder="e.g. 2022" value={frameworkForm.version} onChange={e => setFrameworkForm({ ...frameworkForm, version: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500 font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Initial Controls Count</label>
                                    <input type="number" required placeholder="114" value={frameworkForm.mappedControlsCount || ''} onChange={e => setFrameworkForm({ ...frameworkForm, mappedControlsCount: Number(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500 font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Scope description</label>
                                <textarea rows={2} placeholder="Brief summary of authority standard" value={frameworkForm.description} onChange={e => setFrameworkForm({ ...frameworkForm, description: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Default Lifecycle status</label>
                                <select value={frameworkForm.status} onChange={e => setFrameworkForm({ ...frameworkForm, status: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500">
                                    <option value="Active">Active</option>
                                    <option value="Beta">Beta</option>
                                    <option value="Archived">Archived</option>
                                    <option value="Deprecated">Deprecated</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 rounded font-normal uppercase tracking-wider transition-all">Add GRC Framework</button>
                        </form>
                    </div>

                    {/* Frameworks table */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden self-start">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-xs font-normal text-gray-500 uppercase tracking-widest">Global Framework Registry Database</h3>
                        </div>
                        <div className="overflow-x-auto font-mono">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800 text-gray-500">
                                    <tr>
                                        <th className="p-3 font-normal uppercase tracking-wider font-sans">Framework Standard</th>
                                        <th className="p-3 font-normal uppercase tracking-wider text-center">Version</th>
                                        <th className="p-3 font-normal uppercase tracking-wider text-center">Controls</th>
                                        <th className="p-3 font-normal uppercase tracking-wider">Status</th>
                                        <th className="p-3 font-normal uppercase tracking-wider text-right font-sans">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {frameworks.map(f => (
                                        <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-all font-normal">
                                            <td className="p-3 font-sans">
                                                <span className="font-normal text-gray-900 dark:text-gray-100 block">{f.name}</span>
                                                <span className="font-mono text-[9px] text-gray-400 block uppercase">{f.description}</span>
                                            </td>
                                            <td className="p-3 text-center text-gray-600 dark:text-gray-300">
                                                {f.version}
                                            </td>
                                            <td className="p-3 text-center text-gray-600 dark:text-gray-300">
                                                {f.mappedControlsCount} mapped
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase border font-sans ${f.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : f.status === 'Beta' ? 'bg-purple-50 text-purple-700 border-purple-150' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                                    {f.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right space-x-1 whitespace-nowrap font-sans">
                                                <button onClick={() => handleCloneFramework(f)} title="Clone framework controls mapping" className="px-1.5 py-0.5 text-[9px] bg-gray-50 border border-gray-250 text-gray-500 rounded hover:bg-gray-100 transition-all">Clone</button>
                                                <button onClick={() => handleArchiveFramework(f.id)} title="Archive/Restore framework" className="px-1.5 py-0.5 text-[9px] bg-gray-50 border border-gray-255 text-gray-500 rounded hover:bg-amber-50 hover:text-amber-600 transition-all">{f.status === 'Archived' ? 'Restore' : 'Arch'}</button>
                                                <button onClick={() => handleDeleteFramework(f.id)} className="px-1.5 py-0.5 text-[9px] hover:bg-rose-50 text-rose-500 rounded transition-all">Del</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* C. FEATURE REGISTRY */}
            {subTab === 'features' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add Feature Form */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 p-4 rounded-xl space-y-4 self-start">
                        <h3 className="text-xs font-normal text-gray-500 uppercase tracking-widest block mb-2">Bind Feature to Parent Module</h3>
                        <form onSubmit={handleAddFeature} className="space-y-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Parent Module ID</label>
                                <select value={featureForm.moduleId} onChange={e => setFeatureForm({ ...featureForm, moduleId: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500">
                                    {modules.map(m => (
                                        <option key={m.moduleId} value={m.moduleId}>{m.name} ({m.moduleId})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Feature ID (Unique)</label>
                                <input type="text" required placeholder="e.g. risk_heatmap" value={featureForm.id} onChange={e => setFeatureForm({ ...featureForm, id: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500 font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Feature Name</label>
                                <input type="text" required placeholder="e.g. Interactive Heatmap Grid" value={featureForm.name} onChange={e => setFeatureForm({ ...featureForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Status</label>
                                <select value={featureForm.status} onChange={e => setFeatureForm({ ...featureForm, status: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs outline-none focus:border-teal-500">
                                    <option value="Active">Active</option>
                                    <option value="Beta">Beta</option>
                                    <option value="Deprecated">Deprecated</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 rounded font-normal uppercase tracking-wider transition-all">Register Module Feature</button>
                        </form>
                    </div>

                    {/* Features table */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden self-start">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-xs font-normal text-gray-500 uppercase tracking-widest">Configured Module Features Matrix</h3>
                        </div>
                        <div className="overflow-x-auto font-mono">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800 text-gray-500">
                                    <tr>
                                        <th className="p-3 font-normal uppercase tracking-wider font-sans">Module Feature Details</th>
                                        <th className="p-3 font-normal uppercase tracking-wider">Parent Module</th>
                                        <th className="p-3 font-normal uppercase tracking-wider">Status</th>
                                        <th className="p-3 font-normal uppercase tracking-wider text-center font-sans">Toggle Switch</th>
                                        <th className="p-3 font-normal uppercase tracking-wider text-right font-sans">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {features.map(f => {
                                        const pm = modules.find(m => m.moduleId === f.moduleId);
                                        return (
                                            <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-all font-normal">
                                                <td className="p-3 font-sans">
                                                    <span className="font-normal text-gray-900 dark:text-gray-100 block">{f.name}</span>
                                                    <span className="font-mono text-[9px] text-gray-400 block uppercase">ID: {f.id}</span>
                                                </td>
                                                <td className="p-3 text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                                                    {pm ? pm.name : f.moduleId}
                                                </td>
                                                <td className="p-3 font-sans text-xs">
                                                    {f.status}
                                                </td>
                                                <td className="p-3 text-center font-sans">
                                                    <button onClick={() => handleToggleFeature(f.id)} className={`px-2.5 py-0.5 rounded text-[10px] font-normal uppercase transition-all ${f.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-400 border-gray-250'}`}>
                                                        {f.enabled ? '🟢 Enabled' : '🔴 Disabled'}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-right font-sans">
                                                    <button onClick={() => handleDeleteFeature(f.id)} className="px-2 py-0.5 hover:bg-rose-50 text-rose-500 rounded text-xs transition-all">Delete</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
