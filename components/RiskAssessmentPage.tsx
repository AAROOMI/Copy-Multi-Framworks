
import React, { useState, useMemo, useEffect } from 'react';
import { TrashIcon, ArrowUpRightIcon, CloseIcon, DocumentTextIcon, ExclamationTriangleIcon, MicrophoneIcon } from './Icons';
import type { Risk, Permission, RiskTreatmentOption, ControlEffectiveness } from '../types';
import { likelihoodOptions, impactOptions } from '../data/riskAssessmentData';

const getRiskScoreInfo = (score: number): { text: string, color: string } => {
  if (score <= 5) return { text: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  if (score <= 10) return { text: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
  if (score <= 15) return { text: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
  if (score <= 20) return { text: 'Very High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  return { text: 'Critical', color: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-100 font-bold' };
};

const RiskFormModal: React.FC<{
    risk: Partial<Risk> | null;
    onClose: () => void;
    onSave: (risk: Risk) => void;
}> = ({ risk, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Risk>>({
        title: '', description: '', category: 'General', owner: '',
        inherentLikelihood: 3, inherentImpact: 3, inherentScore: 9,
        existingControl: '', controlEffectiveness: 'Needs Improvement',
        residualLikelihood: 3, residualImpact: 3, residualScore: 9,
        treatmentOption: 'Mitigate', mitigation: '', responsibility: '',
        dueDate: '', acceptanceCriteria: '', approvedBy: '', remarks: '', progress: 0
    });
    const [activeTab, setActiveTab] = useState<'id' | 'analysis' | 'treatment' | 'review'>('id');

    useEffect(() => {
        if (risk) {
            setFormData({ ...risk });
        }
    }, [risk]);

    // Auto-calculate scores
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            inherentScore: (prev.inherentLikelihood || 1) * (prev.inherentImpact || 1),
            residualScore: (prev.residualLikelihood || 1) * (prev.residualImpact || 1),
            // Sync legacy fields
            likelihood: prev.residualLikelihood,
            impact: prev.residualImpact
        }));
    }, [formData.inherentLikelihood, formData.inherentImpact, formData.residualLikelihood, formData.residualImpact]);

    const handleChange = (field: keyof Risk, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: formData.id || `risk-${Date.now()}`
        } as Risk);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {formData.id ? 'Edit Risk Profile' : 'New Risk Assessment'}
                    </h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </header>

                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    {['id', 'analysis', 'treatment', 'review'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab 
                                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            {tab === 'id' && '1. Identification'}
                            {tab === 'analysis' && '2. Analysis'}
                            {tab === 'treatment' && '3. Treatment'}
                            {tab === 'review' && '4. Monitoring & Review'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'id' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Risk Title</label>
                                    <input type="text" className="input" value={formData.title} onChange={e => handleChange('title', e.target.value)} required placeholder="Short title e.g. Server Failure" />
                                </div>
                                <div>
                                    <label className="label">Category / Source</label>
                                    <input type="text" className="input" value={formData.category} onChange={e => handleChange('category', e.target.value)} placeholder="e.g. Technical, Operational" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Detailed Description</label>
                                <textarea className="input" rows={3} value={formData.description} onChange={e => handleChange('description', e.target.value)} required />
                            </div>
                            <div>
                                <label className="label">Risk Owner</label>
                                <input type="text" className="input" value={formData.owner} onChange={e => handleChange('owner', e.target.value)} required />
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold mb-3 dark:text-gray-200">Inherent Risk Assessment (Before Controls)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Likelihood (1-5)</label>
                                        <select className="input" value={formData.inherentLikelihood} onChange={e => handleChange('inherentLikelihood', parseInt(e.target.value))}>
                                            {likelihoodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Impact (1-5)</label>
                                        <select className="input" value={formData.inherentImpact} onChange={e => handleChange('inherentImpact', parseInt(e.target.value))}>
                                            {impactOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Inherent Score</label>
                                        <div className={`mt-1 p-2 rounded text-center font-bold ${getRiskScoreInfo(formData.inherentScore || 0).color}`}>
                                            {formData.inherentScore}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analysis' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="label">Existing Controls</label>
                                <textarea className="input" rows={2} value={formData.existingControl} onChange={e => handleChange('existingControl', e.target.value)} placeholder="List current measures..." />
                            </div>
                            <div>
                                <label className="label">Control Effectiveness</label>
                                <select className="input" value={formData.controlEffectiveness} onChange={e => handleChange('controlEffectiveness', e.target.value)}>
                                    <option value="Effective">Effective</option>
                                    <option value="Needs Improvement">Needs Improvement</option>
                                    <option value="Ineffective">Ineffective</option>
                                </select>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold mb-3 dark:text-gray-200">Residual Risk Assessment (After Controls)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Likelihood (1-5)</label>
                                        <select className="input" value={formData.residualLikelihood} onChange={e => handleChange('residualLikelihood', parseInt(e.target.value))}>
                                            {likelihoodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Impact (1-5)</label>
                                        <select className="input" value={formData.residualImpact} onChange={e => handleChange('residualImpact', parseInt(e.target.value))}>
                                            {impactOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Residual Score</label>
                                        <div className={`mt-1 p-2 rounded text-center font-bold ${getRiskScoreInfo(formData.residualScore || 0).color}`}>
                                            {formData.residualScore}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'treatment' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="label">Treatment Option</label>
                                <select className="input" value={formData.treatmentOption} onChange={e => handleChange('treatmentOption', e.target.value)}>
                                    <option value="Mitigate">Mitigate (Reduce)</option>
                                    <option value="Accept">Accept</option>
                                    <option value="Transfer">Transfer (Share)</option>
                                    <option value="Avoid">Avoid</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Action Plan / Mitigation Steps</label>
                                <textarea className="input" rows={4} value={formData.mitigation} onChange={e => handleChange('mitigation', e.target.value)} placeholder="Detailed steps to treat the risk..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Responsibility (Person/Team)</label>
                                    <input type="text" className="input" value={formData.responsibility} onChange={e => handleChange('responsibility', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Mitigation Progress (%)</label>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="100" 
                                        className="input" 
                                        value={formData.progress || 0} 
                                        onChange={e => handleChange('progress', parseInt(e.target.value))} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'review' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Target Resolution Date</label>
                                    <input type="date" className="input" value={formData.dueDate} onChange={e => handleChange('dueDate', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Approved By</label>
                                    <input type="text" className="input" value={formData.approvedBy} onChange={e => handleChange('approvedBy', e.target.value)} placeholder="Manager Name" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Acceptance Criteria</label>
                                <input type="text" className="input" value={formData.acceptanceCriteria} onChange={e => handleChange('acceptanceCriteria', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Remarks</label>
                                <textarea className="input" rows={2} value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} />
                            </div>
                        </div>
                    )}
                </form>

                <footer className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                    <div className="space-x-3">
                        {activeTab !== 'id' && <button type="button" onClick={() => {
                            if (activeTab === 'review') setActiveTab('treatment');
                            else if (activeTab === 'treatment') setActiveTab('analysis');
                            else setActiveTab('id');
                        }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:underline">Back</button>}
                        
                        {activeTab !== 'review' ? (
                            <button type="button" onClick={() => {
                                if (activeTab === 'id') setActiveTab('analysis');
                                else if (activeTab === 'analysis') setActiveTab('treatment');
                                else setActiveTab('review');
                            }} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">Next</button>
                        ) : (
                            <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-lg">Save Risk</button>
                        )}
                    </div>
                </footer>
            </div>
            <style>{`
                .label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; }
                .dark .label { color: #d1d5db; }
                .input { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid #d1d5db; background-color: #fff; padding: 0.5rem; color: #111827; }
                .dark .input { background-color: #374151; border-color: #4b5563; color: #f9fafb; }
                .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #14b8a6; --tw-ring-color: #14b8a6; }
                @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    );
};

const ReportConfigModal: React.FC<{
    onClose: () => void;
    onGenerate: (filters: { category: string; status: string }) => void;
    categories: string[];
}> = ({ onClose, onGenerate, categories }) => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');

    const handleGenerate = () => {
        onGenerate({ category: selectedCategory, status: selectedStatus });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Generate Risk Report</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Category</label>
                        <select 
                            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Treatment Status</label>
                        <select 
                            className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Mitigate">Mitigate</option>
                            <option value="Accept">Accept</option>
                            <option value="Transfer">Transfer</option>
                            <option value="Avoid">Avoid</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                    <button onClick={handleGenerate} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md">Generate Report</button>
                </div>
            </div>
        </div>
    );
};

const RiskMatrix: React.FC<{ allRisks: Risk[] }> = ({ allRisks }) => {
  const matrix: Risk[][][] = useMemo(() => {
    const m: Risk[][][] = Array(5).fill(0).map(() => Array(5).fill(0).map(() => []));
    allRisks.forEach(risk => {
      // Use Residual Risk for Heatmap
      const l = risk.residualLikelihood || risk.likelihood;
      const i = risk.residualImpact || risk.impact;
      if (l >= 1 && l <= 5 && i >= 1 && i <= 5) {
        m[l - 1][i - 1].push(risk);
      }
    });
    return m;
  }, [allRisks]);

  const getCellColor = (likelihood: number, impact: number): string => {
    const score = likelihood * impact;
    if (score <= 5) return 'bg-green-500/80 hover:bg-green-500';
    if (score <= 10) return 'bg-yellow-400/80 hover:bg-yellow-400 dark:text-gray-800';
    if (score <= 15) return 'bg-orange-500/80 hover:bg-orange-500';
    if (score <= 20) return 'bg-red-500/80 hover:bg-red-500';
    return 'bg-red-700/80 hover:bg-red-700';
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Residual Risk Heatmap</h2>
      <div className="flex justify-center items-start gap-4">
        <div className="flex flex-col items-center justify-center pt-8 self-stretch">
            <div className="transform -rotate-90 whitespace-nowrap font-bold text-gray-600 dark:text-gray-300 tracking-wider">LIKELIHOOD</div>
        </div>
        <div className="flex-1 max-w-2xl">
          <div className="grid grid-cols-[auto_1fr] gap-x-2">
              <div className="flex flex-col-reverse justify-around text-right text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {likelihoodOptions.map(opt => (
                      <div key={opt.value} className="h-16 flex items-center pr-2">{opt.value}</div>
                  ))}
              </div>
              <div className="grid grid-cols-5 grid-rows-5 gap-1.5">
                  {likelihoodOptions.slice().reverse().flatMap(l_opt => 
                      impactOptions.map(i_opt => {
                          const likelihood = l_opt.value;
                          const impact = i_opt.value;
                          const cellRisks = matrix[likelihood - 1]?.[impact - 1] ?? [];
                          const hasRisks = cellRisks.length > 0;
                          
                          return (
                              <div key={`${likelihood}-${impact}`} className="relative group h-16 flex items-center justify-center">
                                  <div className={`w-full h-full rounded-md flex items-center justify-center text-white font-bold text-2xl transition-all duration-200 ${getCellColor(likelihood, impact)} ${hasRisks ? 'cursor-pointer' : ''}`}>
                                      {hasRisks ? cellRisks.length : ''}
                                  </div>
                                  {hasRisks && (
                                      <div className="absolute bottom-full mb-3 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 dark:bg-gray-700">
                                          <h4 className="font-bold border-b border-gray-600 pb-1 mb-2">Risks ({cellRisks.length})</h4>
                                          <ul className="list-disc list-inside space-y-1 max-h-48 overflow-y-auto">
                                              {cellRisks.map(risk => <li key={risk.id}>{risk.title || risk.description.substring(0, 30)}</li>)}
                                          </ul>
                                      </div>
                                  )}
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center text-sm font-semibold text-gray-500 dark:text-gray-400 mt-2 ml-[30px]">
              {impactOptions.map(opt => <div key={opt.value}>{opt.value}</div>)}
          </div>
           <div className="text-center mt-2 font-bold text-gray-600 dark:text-gray-300 ml-[30px]">IMPACT</div>
        </div>
      </div>
    </div>
  );
};

interface RiskAssessmentPageProps {
    risks: Risk[];
    setRisks: (updater: React.SetStateAction<Risk[]>) => void;
    status: 'idle' | 'in-progress';
    onInitiate: () => void;
    onComplete: () => void;
    permissions: Set<Permission>;
    onGenerateReport?: (filteredRisks: Risk[]) => void;
}

export const RiskAssessmentPage: React.FC<RiskAssessmentPageProps> = ({ risks, setRisks, status, onInitiate, onComplete, permissions, onGenerateReport }) => {
    const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    // Deletion confirmation state
    const [riskToDelete, setRiskToDelete] = useState<Risk | null>(null);
    const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

    const isEditable = status === 'in-progress' && permissions.has('riskAssessment:update');

    const handleSaveRisk = (updatedRisk: Risk) => {
        setRisks(prev => {
            const exists = prev.find(r => r.id === updatedRisk.id);
            if (exists) return prev.map(r => r.id === updatedRisk.id ? updatedRisk : r);
            return [...prev, updatedRisk];
        });
        setIsModalOpen(false);
        setEditingRisk(null);
    };

    const initiateDelete = (risk: Risk) => {
        setRiskToDelete(risk);
        setDeleteConfirmationInput('');
    };

    const confirmDelete = () => {
        if (riskToDelete && deleteConfirmationInput === riskToDelete.id) {
            setRisks(prev => prev.filter(r => r.id !== riskToDelete.id));
            setRiskToDelete(null);
        }
    };

    const cancelDelete = () => {
        setRiskToDelete(null);
        setDeleteConfirmationInput('');
    };

    const handleReportGeneration = (filters: { category: string; status: string }) => {
        const filtered = risks.filter(r => {
            const catMatch = filters.category === 'All' || r.category === filters.category;
            const statusMatch = filters.status === 'All' || r.treatmentOption === filters.status;
            return catMatch && statusMatch;
        });
        if (onGenerateReport) {
            onGenerateReport(filtered);
        }
        setIsReportModalOpen(false);
    };

    const uniqueCategories = useMemo(() => Array.from(new Set(risks.map(r => r.category))).filter(Boolean), [risks]);

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Risk Assessment Register</h1>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Comprehensive ISO 31000 aligned Risk Register.</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
                    {onGenerateReport && (
                        <button onClick={() => setIsReportModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            Generate Report
                        </button>
                    )}
                    {isEditable && (
                        <button onClick={() => { setEditingRisk(null); setIsModalOpen(true); }} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">
                            + Add New Risk
                        </button>
                    )}
                    {status === 'idle' ? (
                        <button onClick={onInitiate} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                            <MicrophoneIcon className="w-4 h-4 mr-2" />
                            Initiate AI Assessment
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={onInitiate} className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md shadow-sm text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-800">
                                <MicrophoneIcon className="w-4 h-4 mr-2" />
                                Consult Rashid AI
                            </button>
                            <button onClick={onComplete} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                                Complete Assessment
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <RiskMatrix allRisks={risks} />

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Risk ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title & Category</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Residual Score</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Treatment</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Owner / Due Date</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {risks.map(risk => {
                                const score = risk.residualScore || (risk.likelihood * risk.impact);
                                const scoreInfo = getRiskScoreInfo(score);
                                const progress = risk.progress || 0;
                                
                                const isOverdue = risk.dueDate && new Date(risk.dueDate) < new Date() && progress < 100;
                                
                                return (
                                    <tr key={risk.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{risk.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{risk.title || 'Untitled Risk'}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{risk.category}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${scoreInfo.color}`}>
                                                {score} - {scoreInfo.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {risk.treatmentOption}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap w-32">
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                                                <div className={`h-2.5 rounded-full ${progress === 100 ? 'bg-green-600' : 'bg-teal-600'}`} style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{progress}%</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div>{risk.owner}</div>
                                            <div className={`text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                                {risk.dueDate ? new Date(risk.dueDate).toLocaleDateString() : 'No Date'}
                                                {isOverdue && ' (Overdue)'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => { setEditingRisk(risk); setIsModalOpen(true); }} className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200 mr-4">Edit</button>
                                            {isEditable && <button onClick={() => initiateDelete(risk)} className="text-red-600 hover:text-red-900 dark:text-red-400"><TrashIcon className="w-5 h-5 inline"/></button>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <RiskFormModal 
                    risk={editingRisk} 
                    onClose={() => { setIsModalOpen(false); setEditingRisk(null); }} 
                    onSave={handleSaveRisk} 
                />
            )}

            {isReportModalOpen && (
                <ReportConfigModal
                    categories={uniqueCategories}
                    onClose={() => setIsReportModalOpen(false)}
                    onGenerate={handleReportGeneration}
                />
            )}

            {/* Deletion Confirmation Modal */}
            {riskToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in border border-red-200 dark:border-red-900">
                        <div className="flex items-center justify-center mb-4 text-red-600 dark:text-red-500">
                            <ExclamationTriangleIcon className="w-12 h-12" />
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 dark:text-gray-100 mb-2">Confirm Risk Deletion</h3>
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                            This action cannot be undone. To verify, please type the Risk ID 
                            <span className="font-mono font-bold mx-1 text-gray-800 dark:text-gray-200 select-all">{riskToDelete.id}</span>
                            below.
                        </p>
                        
                        <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-6 text-center font-mono placeholder-gray-400"
                            placeholder={riskToDelete.id}
                            value={deleteConfirmationInput}
                            onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button 
                                onClick={cancelDelete} 
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                disabled={deleteConfirmationInput !== riskToDelete.id}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900 text-white rounded-md font-medium transition-colors"
                            >
                                Permanently Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
