

import React, { useMemo } from 'react';
import { SubdomainAccordion } from './SubdomainAccordion';
import { SparklesIcon } from './Icons';
import type { Domain, Control, Subdomain, GeneratedContent, PolicyDocument, Permission, View, PolicyTone, PolicyLength } from '../types';

interface ContentViewProps {
  domain: Domain;
  activeControlId: string | null;
  setActiveControlId: (id: string | null) => void;
  onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent) => void;
  onGeneratePolicyWithAI?: (control: Control, subdomain: Subdomain, domain: Domain, tone: PolicyTone, length: PolicyLength) => Promise<void>;
  onBatchGenerate?: (domain: Domain) => void;
  documentRepository: PolicyDocument[];
  permissions: Set<Permission>;
  onSetView: (view: View) => void;
  onUpdateDocument?: (doc: PolicyDocument) => void;
}

export const ContentView: React.FC<ContentViewProps> = ({ domain, activeControlId, setActiveControlId, onAddDocument, onGeneratePolicyWithAI, onBatchGenerate, documentRepository, permissions, onSetView, onUpdateDocument }) => {
  const activeHierarchy = useMemo(() => {
    if (!activeControlId) return null;
    for (const subdomain of domain.subdomains) {
      const control = subdomain.controls.find(c => c.id === activeControlId);
      if (control) {
        return { subdomain, control };
      }
    }
    return null;
  }, [domain, activeControlId]);

  return (
    <div className="space-y-6">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <button
              onClick={() => onSetView('dashboard')}
              className="inline-flex items-center text-sm font-normal text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
              Dashboard
            </button>
          </li>
          <li {...(!activeHierarchy ? { 'aria-current': 'page' } : {})}>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
              {activeHierarchy ? (
                 <button
                  onClick={() => setActiveControlId(null)}
                  className="ml-1 text-sm font-normal text-gray-500 hover:text-teal-600 md:ml-2 dark:text-gray-400 dark:hover:text-white"
                >
                  {domain.name}
                </button>
              ) : (
                <span className="ml-1 text-sm font-normal text-gray-700 md:ml-2 dark:text-gray-200">{domain.name}</span>
              )}
            </div>
          </li>
          {activeHierarchy && (
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                <span className="ml-1 text-sm font-normal text-gray-700 md:ml-2 dark:text-gray-200">{activeHierarchy.subdomain.title}</span>
              </div>
            </li>
          )}
        </ol>
      </nav>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-xl font-normal text-gray-800 dark:text-gray-100 tracking-tight">{domain.id}: {domain.name}</h1>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">Explore the subdomains and controls for {domain.name}.</p>
        </div>
        {permissions.has('documents:generate') && onBatchGenerate && (
            <button
                onClick={() => onBatchGenerate(domain)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transform transition hover:scale-105"
            >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Generate All Missing Policies
            </button>
        )}
      </div>
      <div className="space-y-4">
        {domain.subdomains.map((subdomain) => (
          <SubdomainAccordion 
            key={subdomain.id} 
            domain={domain}
            subdomain={subdomain} 
            activeControlId={activeControlId} 
            setActiveControlId={setActiveControlId} 
            onAddDocument={onAddDocument}
            onGeneratePolicyWithAI={onGeneratePolicyWithAI}
            documentRepository={documentRepository}
            permissions={permissions}
            onUpdateDocument={onUpdateDocument}
          />
        ))}
      </div>
    </div>
  );
};
