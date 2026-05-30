

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, ClipboardIcon, CheckIcon, SparklesIcon, ShieldCheckIcon } from './Icons';
import type { Domain, Control, Subdomain, GeneratedContent, PolicyDocument, Permission, PolicyTone, PolicyLength } from '../types';
import { ComplianceAuditModal } from './ComplianceAuditModal';

interface ControlDetailProps {
  control: Control;
  isActive: boolean;
  domain: Domain;
  subdomain: Subdomain;
  onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent, generatedBy: 'user' | 'AI Agent') => void;
  onGeneratePolicyWithAI?: (control: Control, subdomain: Subdomain, domain: Domain, tone: PolicyTone, length: PolicyLength) => Promise<void>;
  documentRepository: PolicyDocument[];
  permissions: Set<Permission>;
}

const ControlDetail = React.forwardRef<HTMLDivElement, ControlDetailProps>(
  ({ control, isActive, domain, subdomain, onAddDocument, onGeneratePolicyWithAI, documentRepository, permissions }, ref) => {
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [showGenSettings, setShowGenSettings] = useState(false);
    const [selectedTone, setSelectedTone] = useState<PolicyTone>('Standard');
    const [selectedLength, setSelectedLength] = useState<PolicyLength>('Standard');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Audit State
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    
    const canGenerate = permissions.has('documents:generate');
    const existingDoc = documentRepository.find(doc => doc.controlId === control.id);

    const handleCopy = (text: string, sectionId: string) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          setCopiedSection(sectionId);
          setTimeout(() => setCopiedSection(null), 2000);
        }).catch(err => {
          console.error('Failed to copy: ', err);
          alert("Failed to copy content.");
        });
      } else {
          alert("Clipboard API not available.");
      }
    };
    
    const CopyButton: React.FC<{ textToCopy: string; sectionId: string }> = ({ textToCopy, sectionId }) => {
      const isCopied = copiedSection === sectionId;
      return (
        <button
          onClick={() => handleCopy(textToCopy, sectionId)}
          className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors disabled:opacity-50"
          aria-label={`Copy ${sectionId} to clipboard`}
          disabled={isCopied}
        >
          {isCopied ? (
            <>
              <CheckIcon className="w-4 h-4 mr-1 text-green-500" />
              <span className="text-green-500 font-normal">Copied!</span>
            </>
          ) : (
            <>
              <ClipboardIcon className="w-4 h-4 mr-1" />
              <span>Copy</span>
            </>
          )}
        </button>
      );
    };

    const handleGenerateClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if(onGeneratePolicyWithAI) {
            setIsGenerating(true);
            try {
              await onGeneratePolicyWithAI(control, subdomain, domain, selectedTone, selectedLength);
              setShowGenSettings(false);
            } finally {
              setIsGenerating(false);
            }
        }
    };
    
    const handleUpdateDocument = (updatedDoc: PolicyDocument) => {
         console.log("Document Signed:", updatedDoc);
         setIsAuditModalOpen(false);
    };
    
    return (
    <div
      ref={ref}
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 border transition-all duration-700 ease-in-out ${
        isActive ? 'border-teal-500 ring-4 ring-teal-200 dark:ring-teal-500/20 shadow-lg' : 'border-gray-200 dark:border-gray-700'
      }`}
      aria-live="polite"
    >
      <div className="flex items-baseline justify-between mb-4">
        <h4 className="text-md font-normal text-teal-800 dark:text-teal-300 font-mono">{control.id}</h4>
        <div className="flex items-center gap-2 relative">
            {/* Agentic Audit Button */}
            {existingDoc && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsAuditModalOpen(true); }}
                    className="flex items-center gap-1 text-xs font-normal px-3 py-1.5 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 transition-colors mr-2"
                    title="Validate compliance with AI Agents"
                >
                    <ShieldCheckIcon className="w-3 h-3" />
                    {existingDoc.agentSignatures?.length ? 'Audit Signed' : 'Start Agentic Audit'}
                </button>
            )}

            {canGenerate && onGeneratePolicyWithAI && (
                <div className="relative inline-flex shadow-sm rounded-md" role="group">
                    {/* Quick Action Button */}
                    <button 
                        onClick={handleGenerateClick}
                        disabled={isGenerating}
                        className={`flex items-center gap-1 text-xs font-normal px-3 py-1.5 rounded-l-md transition-colors border-r border-black/10 dark:border-white/10 disabled:opacity-70 disabled:cursor-not-allowed ${existingDoc ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600' : 'text-white bg-purple-600 hover:bg-purple-700'}`}
                        title="Quick Generate (Standard Tone/Length)"
                    >
                        {isGenerating ? (
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <SparklesIcon className="w-3 h-3" />
                        )}
                        {isGenerating ? 'Generating...' : (existingDoc ? 'Regenerate' : 'Generate')}
                    </button>
                    
                    {/* Settings Dropdown Trigger */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowGenSettings(!showGenSettings); }}
                        disabled={isGenerating}
                        className={`px-2 py-1.5 rounded-r-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${existingDoc ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600' : 'text-white bg-purple-600 hover:bg-purple-700'}`}
                        title="Configure Generation Settings"
                    >
                        <ChevronDownIcon className="w-3 h-3" />
                    </button>
                    
                    {/* Settings Dropdown Content */}
                    {showGenSettings && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4" onClick={(e) => e.stopPropagation()}>
                            <h5 className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase mb-3">AI Generation Settings</h5>
                            <div className="mb-3">
                                <label className="block text-xs font-normal text-gray-700 dark:text-gray-300 mb-1">Tone</label>
                                <select 
                                    value={selectedTone} 
                                    onChange={(e) => setSelectedTone(e.target.value as PolicyTone)}
                                    className="block w-full text-xs rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="Formal">Formal</option>
                                    <option value="Strict">Strict (Compliance Focused)</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-normal text-gray-700 dark:text-gray-300 mb-1">Length</label>
                                <select 
                                    value={selectedLength} 
                                    onChange={(e) => setSelectedLength(e.target.value as PolicyLength)}
                                    className="block w-full text-xs rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="Concise">Concise</option>
                                    <option value="Comprehensive">Comprehensive</option>
                                </select>
                            </div>
                            <button
                                onClick={handleGenerateClick}
                                disabled={isGenerating}
                                className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-xs font-normal rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <SparklesIcon className="w-3 h-3 mr-2" />
                                )}
                                {isGenerating ? 'Generating...' : (existingDoc ? 'Regenerate Document' : 'Generate Document')}
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            <div className="text-xs text-gray-500 dark:text-gray-400 font-sans border-l pl-3 dark:border-gray-600">
                <span>v{control.version}</span>
            </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h5 className="text-sm font-normal text-gray-600 dark:text-gray-300">Description</h5>
                <CopyButton textToCopy={control.description} sectionId={`desc-${control.id}`} />
            </div>
            <p className="text-gray-700 dark:text-gray-200 text-sm">{control.description}</p>
        </div>

        {control.relevantTools && control.relevantTools.length > 0 && (
            <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                <h5 className="text-xs font-normal text-blue-700 dark:text-blue-300 uppercase tracking-wide">Relevant Cybersecurity Tools</h5>
                <ul className="list-none space-y-1">
                    {control.relevantTools.map((tool, idx) => (
                        <li key={idx} className="text-xs text-blue-800 dark:text-blue-200 flex items-start">
                            <span className="mr-2">•</span> {tool}
                        </li>
                    ))}
                </ul>
            </div>
        )}

        <div className="space-y-2">
             <div className="flex justify-between items-center">
                <h5 className="text-sm font-normal text-gray-600 dark:text-gray-300">Implementation Requirements Checklist (NCA Guide)</h5>
                <CopyButton textToCopy={`- ${control.implementationGuidelines.join('\n- ')}`} sectionId={`impl-${control.id}`} />
            </div>
            <ul className="space-y-2">
                {control.implementationGuidelines.map((guideline, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center mr-2 mt-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-teal-500"></div>
                        </div>
                        <span>{guideline}</span>
                    </li>
                ))}
            </ul>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h5 className="text-sm font-normal text-gray-600 dark:text-gray-300">Expected Deliverables</h5>
                <CopyButton textToCopy={`- ${control.expectedDeliverables.join('\n- ')}`} sectionId={`deli-${control.id}`} />
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-md p-3 border border-gray-100 dark:border-gray-700">
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                    {control.expectedDeliverables.map((deliverable, index) => (
                        <li key={index} className="pl-1">{deliverable}</li>
                    ))}
                </ul>
            </div>
        </div>
      </div>

       {control.history && control.history.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsHistoryVisible(!isHistoryVisible)}
              className="w-full flex justify-between items-center text-left text-sm font-normal text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              aria-expanded={isHistoryVisible}
            >
              <span>Version History</span>
              <ChevronDownIcon className={`w-5 h-5 transform transition-transform duration-200 ${isHistoryVisible ? 'rotate-180' : ''}`} />
            </button>
            {isHistoryVisible && (
              <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-6">
                {[...control.history].reverse().map((entry) => (
                  <div key={entry.version} className="relative">
                    <div className="absolute top-1 -left-[26px] h-3 w-3 bg-gray-300 dark:bg-gray-500 rounded-full border-4 border-white dark:border-gray-800"></div>
                    <div className="pl-4">
                        <div className="flex items-baseline justify-between">
                            <h6 className="font-normal text-gray-700 dark:text-gray-300">Version {entry.version}</h6>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{entry.date}</p>
                        </div>
                        <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-gray-600 dark:text-gray-300">
                            {entry.changes.map((change, index) => (
                            <li key={index}>{change}</li>
                            ))}
                        </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {existingDoc && isAuditModalOpen && (
            <ComplianceAuditModal
                doc={existingDoc}
                controlData={{ control, subdomain, domain }}
                onClose={() => setIsAuditModalOpen(false)}
                onUpdateDocument={handleUpdateDocument}
            />
        )}
    </div>
    );
  }
);

interface SubdomainAccordionProps {
  domain: Domain;
  subdomain: Subdomain;
  activeControlId: string | null;
  setActiveControlId: (id: string | null) => void;
  onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent, generatedBy: 'user' | 'AI Agent') => void;
  onGeneratePolicyWithAI?: (control: Control, subdomain: Subdomain, domain: Domain, tone: PolicyTone, length: PolicyLength) => Promise<void>;
  documentRepository: PolicyDocument[];
  permissions: Set<Permission>;
}

export const SubdomainAccordion: React.FC<SubdomainAccordionProps> = ({
  domain,
  subdomain,
  activeControlId,
  setActiveControlId,
  onAddDocument,
  onGeneratePolicyWithAI,
  documentRepository,
  permissions
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const controlRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const hasActiveControl = subdomain.controls.some(c => c.id === activeControlId);
    if (hasActiveControl) {
        setIsOpen(true);
        if (activeControlId && controlRefs.current[activeControlId]) {
            controlRefs.current[activeControlId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [activeControlId, subdomain.controls]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm mb-4 overflow-hidden">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
            <div className="flex items-center text-left">
                <span className="font-mono text-sm font-normal text-gray-500 dark:text-gray-400 mr-3">{subdomain.id}</span>
                <div>
                    <h3 className="text-base font-normal text-gray-800 dark:text-gray-200">{subdomain.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subdomain.objective}</p>
                </div>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
            <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {subdomain.controls.map(control => (
                    <div key={control.id} onClick={() => setActiveControlId(control.id)}>
                        <ControlDetail
                            ref={(el) => { controlRefs.current[control.id] = el; }}
                            control={control}
                            isActive={activeControlId === control.id}
                            domain={domain}
                            subdomain={subdomain}
                            onAddDocument={onAddDocument}
                            onGeneratePolicyWithAI={onGeneratePolicyWithAI}
                            documentRepository={documentRepository}
                            permissions={permissions}
                        />
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};
