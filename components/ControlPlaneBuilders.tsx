import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
    Activity, 
    Layers, 
    FileText, 
    Plus, 
    Trash2, 
    DollarSign, 
    Grid, 
    Check, 
    Settings,
    Copy
} from 'lucide-react';

interface WorkflowItem {
    id: string;
    name: string;
    status: string;
    steps: string;
    version: string;
}

interface FormTemplateItem {
    id: string;
    name: string;
    fields: string;
    status: string;
}

interface DashboardWidgetItem {
    id: string;
    name: string;
    category: string;
    size: string;
    status: string;
}

interface BillingPlanItem {
    id: string;
    name: string;
    price: string;
    limit: string;
    model: string;
}

interface ControlPlaneBuildersProps {
    addAuditLog: (action: string, details: string) => void;
}

const defaultWorkflows: WorkflowItem[] = [
    { id: 'wf-policy-approval', name: 'Standard Policy Lifecycle Approval', status: 'Active', steps: 'Author -> Analyst Check -> CISO Approval -> Publish', version: 'v1.2' },
    { id: 'wf-incident-response', name: 'Critical Cybersecurity Incident escalation', status: 'Active', steps: 'Alert -> Security Analyst Review -> CIO Sign-off -> CAPA', version: 'v2.0' }
];

const defaultForms: FormTemplateItem[] = [
    { id: 'form-vendor-risk', name: 'Standard Third-Party Risk Questionnaire', fields: 'Vendor Name, SOC 2 status, Encryption type, Liability policy', status: 'Active' },
    { id: 'form-impact-analysis', name: 'Business Impact Assessment Intake', fields: 'Asset Name, MTD, RTO, Operational Workaround, Impact score', status: 'Active' }
];

const defaultWidgets: DashboardWidgetItem[] = [
    { id: 'widget-compliance', name: 'National Compliance Radar Wheel', category: 'Executive', size: 'Full', status: 'Active' },
    { id: 'widget-risk-heatmap', name: 'Dynamic Heatmap Matrix (5x5)', category: 'Risk Operations', size: 'Half', status: 'Active' },
    { id: 'widget-audit-stats', name: 'CAPA Finding Burnout chart', category: 'Audit', size: 'Half', status: 'Active' }
];

const defaultBillingPlans: BillingPlanItem[] = [
    { id: 'tier-trial', name: 'Trial Access Sandbox', price: '$0', limit: '7 Days, 1 Admin, 1 Framework', model: 'Freemium' },
    { id: 'tier-monthly', name: 'Sovereign Compliance Monthly', price: '$950 / month', limit: '30 Days, 5 Seats, 3 Frameworks', model: 'Subscription' },
    { id: 'tier-yearly', name: 'Enterprise Governance Unlimited', price: '$8,500 / year', limit: '365 Days, Unlimited Seats, All Frameworks', model: 'Enterprise Unlimited' }
];

export const ControlPlaneBuilders: React.FC<ControlPlaneBuildersProps> = ({ addAuditLog }) => {
    const [subTab, setSubTab] = useState<'workflows' | 'forms' | 'dashboards' | 'billing'>('workflows');

    // States
    const [workflows, setWorkflows] = useState<WorkflowItem[]>(() => {
        const saved = localStorage.getItem('control_plane_workflows');
        return saved ? JSON.parse(saved) : defaultWorkflows;
    });

    const [forms, setForms] = useState<FormTemplateItem[]>(() => {
        const saved = localStorage.getItem('control_plane_forms');
        return saved ? JSON.parse(saved) : defaultForms;
    });

    const [widgets, setWidgets] = useState<DashboardWidgetItem[]>(() => {
        const saved = localStorage.getItem('control_plane_widgets');
        return saved ? JSON.parse(saved) : defaultWidgets;
    });

    const [plans, setPlans] = useState<BillingPlanItem[]>(() => {
        const saved = localStorage.getItem('control_plane_plans');
        return saved ? JSON.parse(saved) : defaultBillingPlans;
    });

    // Forms
    const [wfForm, setWfForm] = useState({ id: '', name: '', steps: '', version: 'v1.0' });
    const [fmForm, setFmForm] = useState({ id: '', name: '', fields: '' });
    const [dbForm, setDbForm] = useState({ id: '', name: '', category: 'Executive', size: 'Half' });
    const [blForm, setBlForm] = useState({ id: '', name: '', price: '', limit: '', model: 'Subscription' });

    // Database Sync fallbacks
    const saveWorkflows = async (updated: WorkflowItem[]) => {
        setWorkflows(updated);
        localStorage.setItem('control_plane_workflows', JSON.stringify(updated));
        try { await setDoc(doc(db, 'system_control_plane', 'workflows_registry'), { items: updated }, { merge: true }); } catch (e) {}
    };

    const saveForms = async (updated: FormTemplateItem[]) => {
        setForms(updated);
        localStorage.setItem('control_plane_forms', JSON.stringify(updated));
        try { await setDoc(doc(db, 'system_control_plane', 'forms_registry'), { items: updated }, { merge: true }); } catch (e) {}
    };

    const saveWidgets = async (updated: DashboardWidgetItem[]) => {
        setWidgets(updated);
        localStorage.setItem('control_plane_widgets', JSON.stringify(updated));
        try { await setDoc(doc(db, 'system_control_plane', 'dashboard_templates'), { items: updated }, { merge: true }); } catch (e) {}
    };

    const savePlans = async (updated: BillingPlanItem[]) => {
        setPlans(updated);
        localStorage.setItem('control_plane_plans', JSON.stringify(updated));
        try { await setDoc(doc(db, 'system_control_plane', 'billing_rates'), { items: updated }, { merge: true }); } catch (e) {}
    };

    // Handlers Workflow
    const handleAddWorkflow = (e: React.FormEvent) => {
        e.preventDefault();
        if (!wfForm.id || !wfForm.name || !wfForm.steps) return;
        const item: WorkflowItem = {
            id: wfForm.id.toLowerCase().trim(),
            name: wfForm.name,
            steps: wfForm.steps,
            version: wfForm.version,
            status: 'Active'
        };
        const updated = [...workflows, item];
        saveWorkflows(updated);
        addAuditLog("CREATE_WORKFLOW_TEMPLATE", `Created workflow ${item.name} (${item.version})`);
        setWfForm({ id: '', name: '', steps: '', version: 'v1.0' });
    };

    const handleDeleteWorkflow = (id: string) => {
        const updated = workflows.filter(w => w.id !== id);
        saveWorkflows(updated);
        addAuditLog("DELETE_WORKFLOW_TEMPLATE", `Removed workflow ${id}`);
    };

    // Handlers Form
    const handleAddForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fmForm.id || !fmForm.name || !fmForm.fields) return;
        const item: FormTemplateItem = {
            id: fmForm.id.toLowerCase().trim(),
            name: fmForm.name,
            fields: fmForm.fields,
            status: 'Active'
        };
        const updated = [...forms, item];
        saveForms(updated);
        addAuditLog("CREATE_FORM_TEMPLATE", `Created custom form layout ${item.name}`);
        setFmForm({ id: '', name: '', fields: '' });
    };

    const handleDeleteForm = (id: string) => {
        const updated = forms.filter(f => f.id !== id);
        saveForms(updated);
        addAuditLog("DELETE_FORM_TEMPLATE", `Removed form template ${id}`);
    };

    // Handlers Widget
    const handleAddWidget = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dbForm.id || !dbForm.name) return;
        const item: DashboardWidgetItem = {
            id: dbForm.id.toLowerCase().trim(),
            name: dbForm.name,
            category: dbForm.category,
            size: dbForm.size,
            status: 'Active'
        };
        const updated = [...widgets, item];
        saveWidgets(updated);
        addAuditLog("CREATE_DASHBOARD_WIDGET", `Registered dashboard widget ${item.name}`);
        setDbForm({ id: '', name: '', category: 'Executive', size: 'Half' });
    };

    const handleDeleteWidget = (id: string) => {
        const updated = widgets.filter(w => w.id !== id);
        saveWidgets(updated);
        addAuditLog("DELETE_DASHBOARD_WIDGET", `Removed widget ${id}`);
    };

    // Handlers Billing Plan
    const handleAddPlan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!blForm.id || !blForm.name || !blForm.price) return;
        const item: BillingPlanItem = {
            id: blForm.id.toLowerCase().trim(),
            name: blForm.name,
            price: blForm.price,
            limit: blForm.limit || 'Standard Node deployment',
            model: blForm.model
        };
        const updated = [...plans, item];
        savePlans(updated);
        addAuditLog("CREATE_BILLING_PLAN", `Configured plan tier ${item.name} at rate ${item.price}`);
        setBlForm({ id: '', name: '', price: '', limit: '', model: 'Subscription' });
    };

    const handleDeletePlan = (id: string) => {
        const updated = plans.filter(p => p.id !== id);
        savePlans(updated);
        addAuditLog("DELETE_BILLING_PLAN", `Removed plan tier ${id}`);
    };

    return (
        <div className="space-y-4">
            {/* Switchers */}
            <div className="flex border-b border-gray-150 dark:border-gray-800 gap-4 pb-2">
                <button onClick={() => setSubTab('workflows')} className={`text-xs uppercase tracking-wider pb-1 transition-all ${subTab === 'workflows' ? 'text-teal-600 border-b-2 border-teal-500 font-medium' : 'text-gray-400 hover:text-gray-600 font-normal'}`}>Dynamic Workflow Builder</button>
                <button onClick={() => setSubTab('forms')} className={`text-xs uppercase tracking-wider pb-1 transition-all ${subTab === 'forms' ? 'text-teal-600 border-b-2 border-teal-500 font-medium' : 'text-gray-400 hover:text-gray-600 font-normal'}`}>Dynamic Form Builder</button>
                <button onClick={() => setSubTab('dashboards')} className={`text-xs uppercase tracking-wider pb-1 transition-all ${subTab === 'dashboards' ? 'text-teal-600 border-b-2 border-teal-500 font-medium' : 'text-gray-400 hover:text-gray-600 font-normal'}`}>Dynamic Dashboard Builder</button>
                <button onClick={() => setSubTab('billing')} className={`text-xs uppercase tracking-wider pb-1 transition-all ${subTab === 'billing' ? 'text-teal-600 border-b-2 border-teal-500 font-medium' : 'text-gray-400 hover:text-gray-600 font-normal'}`}>Billing Control Center</button>
            </div>

            {/* A. WORKFLOW BUILDER */}
            {subTab === 'workflows' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                    <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 p-4 rounded-xl space-y-4 self-start">
                        <h4 className="text-xs font-normal text-gray-500 uppercase tracking-widest">Construct Process Workflow</h4>
                        <form onSubmit={handleAddWorkflow} className="space-y-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Workflow ID</label>
                                <input type="text" required placeholder="wf-soc-escalation" value={wfForm.id} onChange={e => setWfForm({ ...wfForm, id: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Workflow Name</label>
                                <input type="text" required placeholder="SOC Alarm Critical Escalation" value={wfForm.name} onChange={e => setWfForm({ ...wfForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Sequential Process Steps (comma separated)</label>
                                <input type="text" required placeholder="Initiation -> Team Review -> Approval -> Closing Signoff" value={wfForm.steps} onChange={e => setWfForm({ ...wfForm, steps: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Version Indicator</label>
                                <input type="text" required value={wfForm.version} onChange={e => setWfForm({ ...wfForm, version: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none font-mono" />
                            </div>
                            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 rounded uppercase tracking-wider transition-all">Compile Workflow Node</button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        {workflows.map(wf => (
                            <div key={wf.id} className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-xl p-4 flex justify-between items-center">
                                <div className="space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <span className="font-normal text-sm text-gray-900 dark:text-gray-100">{wf.name}</span>
                                        <span className="text-[9px] font-mono font-normal bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded uppercase">{wf.version}</span>
                                    </div>
                                    <div className="flex gap-1.5 items-center flex-wrap">
                                        {(wf.steps || '').split('->').map((step, idx) => (
                                            <React.Fragment key={idx}>
                                                {idx > 0 && <span className="text-gray-400 text-[10px]">→</span>}
                                                <span className="px-2 py-0.5 rounded bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-mono text-[9px] uppercase">{step.trim()}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteWorkflow(wf.id)} className="p-1 text-gray-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* B. FORM BUILDER */}
            {subTab === 'forms' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                    <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 p-4 rounded-xl space-y-4 self-start">
                        <h4 className="text-xs font-normal text-gray-500 uppercase tracking-widest">Design Compliance Form Input</h4>
                        <form onSubmit={handleAddForm} className="space-y-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Form ID</label>
                                <input type="text" required placeholder="form-cyber-incident" value={fmForm.id} onChange={e => setFmForm({ ...fmForm, id: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Form Name</label>
                                <input type="text" required placeholder="Vulnerability Penetration Intake" value={fmForm.name} onChange={e => setFmForm({ ...fmForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Interactive Fields (comma separated)</label>
                                <input type="text" required placeholder="IP Address, Operating System, Severity level, Owner" value={fmForm.fields} onChange={e => setFmForm({ ...fmForm, fields: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none font-mono" />
                            </div>
                            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 rounded uppercase tracking-wider transition-all">Compile Intake Form</button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        {forms.map(fm => (
                            <div key={fm.id} className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-xl p-4 flex justify-between items-center">
                                <div className="space-y-2">
                                    <span className="font-normal text-sm text-gray-900 dark:text-gray-100 block">{fm.name}</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {(fm.fields || '').split(',').map((fld, idx) => (
                                            <span key={idx} className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-mono text-[9px] uppercase">{fld.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteForm(fm.id)} className="p-1 text-gray-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* C. DASHBOARD WIDGETS BUILDER */}
            {subTab === 'dashboards' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                    <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 p-4 rounded-xl space-y-4 self-start">
                        <h4 className="text-xs font-normal text-gray-500 uppercase tracking-widest">Register Dashboard Analytical Widget</h4>
                        <form onSubmit={handleAddWidget} className="space-y-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Widget Unique ID</label>
                                <input type="text" required placeholder="widget-risk-scatter" value={dbForm.id} onChange={e => setDbForm({ ...dbForm, id: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Widget Label Title</label>
                                <input type="text" required placeholder="NCA ECC Control Gap Bar Chart" value={dbForm.name} onChange={e => setDbForm({ ...dbForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Group Category</label>
                                    <select value={dbForm.category} onChange={e => setDbForm({ ...dbForm, category: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none">
                                        <option value="Executive">Executive</option>
                                        <option value="Risk Operations">Risk Operations</option>
                                        <option value="Audit">Audit</option>
                                        <option value="Compliance">Compliance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Grid Sizing</label>
                                    <select value={dbForm.size} onChange={e => setDbForm({ ...dbForm, size: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none">
                                        <option value="Half">Half Grid (1/2)</option>
                                        <option value="Full">Full Span (1/1)</option>
                                        <option value="Third">Third Grid (1/3)</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 rounded uppercase tracking-wider transition-all">Compile Dashboard Widget</button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        {widgets.map(wd => (
                            <div key={wd.id} className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-xl p-4 flex justify-between items-center">
                                <div className="space-y-1">
                                    <span className="font-normal text-sm text-gray-900 dark:text-gray-100 block">{wd.name}</span>
                                    <div className="flex gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 font-mono text-[9px] uppercase">{wd.category}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 font-mono text-[9px] uppercase">{wd.size} layout</span>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteWidget(wd.id)} className="p-1 text-gray-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* D. BILLING CONTROL CENTER */}
            {subTab === 'billing' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                    <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 p-4 rounded-xl space-y-4 self-start">
                        <h4 className="text-xs font-normal text-gray-500 uppercase tracking-widest font-sans">Set Plan Rate & Monetization</h4>
                        <form onSubmit={handleAddPlan} className="space-y-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Plan Token ID</label>
                                <input type="text" required placeholder="tier-corporate" value={blForm.id} onChange={e => setBlForm({ ...blForm, id: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Plan Name</label>
                                <input type="text" required placeholder="Corporate Sovereign Yearly" value={blForm.name} onChange={e => setBlForm({ ...blForm, name: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Monetization Price</label>
                                    <input type="text" required placeholder="$12,000 / yr" value={blForm.price} onChange={e => setBlForm({ ...blForm, price: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Billing Model</label>
                                    <select value={blForm.model} onChange={e => setBlForm({ ...blForm, model: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none">
                                        <option value="Subscription">Subscription</option>
                                        <option value="Pay As You Go">Pay As You Go</option>
                                        <option value="Seat Based">Seat Based</option>
                                        <option value="Consumption">Consumption</option>
                                        <option value="Enterprise Unlimited">Enterprise Unlimited</option>
                                        <option value="Freemium">Freemium</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Entitlements / Quota description</label>
                                <input type="text" required placeholder="Unlimited users, 12 frameworks standard" value={blForm.limit} onChange={e => setBlForm({ ...blForm, limit: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 p-2 text-xs outline-none" />
                            </div>
                            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs py-2 rounded uppercase tracking-wider transition-all">Publish Pricing Model</button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        {plans.map(p => (
                            <div key={p.id} className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-xl p-4 flex justify-between items-center">
                                <div className="space-y-1">
                                    <div className="flex gap-2 items-center">
                                        <span className="font-normal text-sm text-gray-900 dark:text-gray-100">{p.name}</span>
                                        <span className="font-mono text-teal-600 dark:text-teal-400 text-xs">{p.price}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Model: {p.model} — Quota: {p.limit}</p>
                                </div>
                                <button onClick={() => handleDeletePlan(p.id)} className="p-1 text-gray-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
