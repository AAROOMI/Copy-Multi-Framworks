
import React, { useState } from 'react';
import { CloseIcon, CheckCircleIcon, UploadIcon, LockClosedIcon } from './Icons';
import type { Risk, AuditAction } from '../types';

interface IntegrationsPageProps {
    onAddRisk: (category: string, riskData: Omit<Risk, 'id'>) => void;
    addNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
    addAuditLog: (action: AuditAction, details: string, targetId?: string) => void;
}

interface Connector {
    id: string;
    name: string;
    type: 'Cloud' | 'Database' | 'SIEM' | 'ERP' | 'SOAR' | 'SaaS';
    status: 'disconnected' | 'connected' | 'syncing' | 'error';
    iconUrl: string;
    description: string;
    lastSync?: number;
}

// Mock Data for Available Connectors
const initialConnectors: Connector[] = [
    {
        id: 'sap-erp',
        name: 'SAP ERP',
        type: 'ERP',
        status: 'disconnected',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg',
        description: 'Sync Audit Logs and User Privileges.',
    },
    {
        id: 'google-workspace',
        name: 'Google Workspace',
        type: 'SaaS',
        status: 'disconnected',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Google_Workspace_Logo.svg',
        description: 'Monitor Email Security, Drive Permissions, and User Activity.',
    },
    {
        id: 'google-cloud',
        name: 'Google Cloud Platform',
        type: 'Cloud',
        status: 'disconnected',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg',
        description: 'Monitor IAM and Storage Buckets.',
    },
    {
        id: 'oracle-db',
        name: 'Oracle Database',
        type: 'Database',
        status: 'disconnected',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg',
        description: 'Fetch DB Vulnerability Scans.',
    },
    {
        id: 'splunk-siem',
        name: 'Splunk SIEM',
        type: 'SIEM',
        status: 'disconnected',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Splunk_logo.png/800px-Splunk_logo.png', // Fallback if image fails
        description: 'Import Security Alerts and Incidents.',
    },
    {
        id: 'palo-alto-cortex',
        name: 'Palo Alto Cortex XSOAR',
        type: 'SOAR',
        status: 'disconnected',
        iconUrl: 'https://www.paloaltonetworks.com/content/dam/pan/en_US/images/logos/brand/pan-logo-badge-blue-medium-kick-up.png',
        description: 'Automate Incident Response Data.',
    },
    {
        id: 'metamask-wallet',
        name: 'MetaMask Wallet',
        type: 'SaaS',
        status: 'disconnected',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Monkey_Face.svg',
        description: 'Verify Security Officer identities and secure report signing via Web3.',
    }
];

export const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ onAddRisk, addNotification, addAuditLog }) => {
    const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);
    const [connectingId, setConnectingId] = useState<string | null>(null); // For modal logic

    // Simulate connecting to an API
    const handleConnect = (id: string) => {
        // In a real app, this would open OAuth flow or API Key modal
        const key = prompt(`Enter API Key/Token for ${connectors.find(c => c.id === id)?.name}:`);
        if (key) {
            setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'connected' } : c));
            addNotification(`${connectors.find(c => c.id === id)?.name} connected successfully.`, 'success');
            addAuditLog('INTEGRATION_SYNC', `Connected integration: ${id}`);
        }
    };

    const handleDisconnect = (id: string) => {
        if(window.confirm('Disconnect this integration?')) {
            setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'disconnected', lastSync: undefined } : c));
            addNotification(`${connectors.find(c => c.id === id)?.name} disconnected.`, 'info');
        }
    };

    // Simulate API Fetch Logic based on Connector Type
    const simulateExternalApiCall = (connector: Connector): Promise<any[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const risks: any[] = [];
                const timestamp = new Date().toISOString().split('T')[0];

                if (connector.id === 'sap-erp') {
                    risks.push({
                        title: `SAP: Unauthorized Privileged Access`,
                        description: "Detected user 'J_DOE' accessing critical T-Codes (SU01) outside of approved window via SAP GRC.",
                        category: "Access Control",
                        owner: "SAP Security Team",
                        inherentLikelihood: 4,
                        inherentImpact: 5,
                        mitigation: "Review SAP GRC logs, revoke privileges, and interview user.",
                        source: 'SAP ERP'
                    });
                } else if (connector.id === 'google-workspace') {
                    risks.push({
                        title: `Workspace: Suspicious Login Activity`,
                        description: "Multiple failed login attempts detected for admin account from unusual geography (IP 203.0.113.42).",
                        category: "Identity Management",
                        owner: "IT Admin",
                        inherentLikelihood: 5,
                        inherentImpact: 5,
                        mitigation: "Force password reset and enable strict 2FA enforcement.",
                        source: 'Google Workspace'
                    });
                    risks.push({
                        title: `Workspace: Sensitive Data External Share`,
                        description: "File 'Q3_Financials_Draft.xlsx' shared with external domain (gmail.com) by user 'finance_intern'.",
                        category: "Data Loss Prevention",
                        owner: "Data Privacy Officer",
                        inherentLikelihood: 4,
                        inherentImpact: 4,
                        mitigation: "Revoke sharing permissions and review DLP policies for Finance OU.",
                        source: 'Google Workspace'
                    });
                } else if (connector.id === 'google-cloud') {
                    risks.push({
                        title: `GCP: Public S3 Bucket Detected`,
                        description: "Storage bucket 'finance-backup-2024' is publicly accessible via internet.",
                        category: "Cloud Security",
                        owner: "Cloud Ops",
                        inherentLikelihood: 5,
                        inherentImpact: 5,
                        mitigation: "Enforce 'no public access' policy on all storage buckets immediately.",
                        source: 'Google Cloud'
                    });
                } else if (connector.id === 'oracle-db') {
                    risks.push({
                        title: `Oracle: Unpatched CVE-2023-XXXX`,
                        description: "Critical vulnerability found in Oracle HR Database (Version 19c). Patch missing.",
                        category: "Vulnerability Management",
                        owner: "DBA Team",
                        inherentLikelihood: 3,
                        inherentImpact: 4,
                        mitigation: "Apply critical patch update (CPU) immediately.",
                        source: 'Oracle DB'
                    });
                } else if (connector.id === 'splunk-siem') {
                    risks.push({
                        title: `SIEM: Brute Force Attack Pattern`,
                        description: "Multiple failed login attempts (500+) detected from IP 192.168.1.50 against Active Directory.",
                        category: "Network Security",
                        owner: "SOC Team",
                        inherentLikelihood: 5,
                        inherentImpact: 3,
                        mitigation: "Block IP at firewall and investigate compromised host.",
                        source: 'Splunk'
                    });
                } else if (connector.id === 'palo-alto-cortex') {
                     risks.push({
                        title: `SOAR: Phishing Campaign Detected`,
                        description: "Automated analysis indicates a coordinated phishing campaign targeting Finance dept.",
                        category: "Email Security",
                        owner: "SOC Team",
                        inherentLikelihood: 4,
                        inherentImpact: 4,
                        mitigation: "Purge malicious emails and trigger user awareness training.",
                        source: 'Cortex XSOAR'
                    });
                }

                resolve(risks);
            }, 2500); // 2.5s delay to simulate network request
        });
    };

    const handleSync = async (id: string) => {
        const connector = connectors.find(c => c.id === id);
        if (!connector) return;

        setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'syncing' } : c));

        try {
            const fetchedRisks = await simulateExternalApiCall(connector);
            
            // Map and Add to Risk Register
            fetchedRisks.forEach(riskData => {
                // Calculate scores before adding
                const iScore = riskData.inherentLikelihood * riskData.inherentImpact;
                
                const finalRisk: any = {
                    title: riskData.title,
                    description: riskData.description,
                    category: riskData.category,
                    owner: riskData.owner,
                    inherentLikelihood: riskData.inherentLikelihood,
                    inherentImpact: riskData.inherentImpact,
                    inherentScore: iScore,
                    // Default values for new risks
                    existingControl: 'Pending Assessment',
                    controlEffectiveness: 'Needs Improvement',
                    residualLikelihood: riskData.inherentLikelihood, 
                    residualImpact: riskData.inherentImpact,
                    residualScore: iScore,
                    treatmentOption: 'Mitigate',
                    mitigation: riskData.mitigation,
                    responsibility: riskData.owner,
                    dueDate: '',
                    progress: 0, // Default progress
                    acceptanceCriteria: 'Risk remediated or accepted by Management.',
                    approvedBy: 'Pending Review',
                    remarks: `Imported from ${riskData.source} at ${new Date().toLocaleString()}`
                };

                // Add to main app state
                onAddRisk(riskData.category, finalRisk);
            });

            setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'connected', lastSync: Date.now() } : c));
            addNotification(`Successfully synced ${fetchedRisks.length} risks from ${connector.name}.`, 'success');
            addAuditLog('INTEGRATION_SYNC', `Synced ${fetchedRisks.length} items from ${connector.name} into Risk Register.`);

        } catch (error) {
            console.error("Sync failed", error);
            setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'error' } : c));
            addNotification(`Failed to sync with ${connector.name}.`, 'error');
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl font-normal text-gray-800 dark:text-gray-100 tracking-tight">Enterprise Integration Hub</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Connect external systems to automatically fetch security data and populate the Risk Register.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectors.map(connector => (
                    <div key={connector.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all hover:shadow-lg">
                        <div className="p-6 flex-grow flex flex-col items-center text-center">
                            <div className="w-16 h-16 mb-4 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-full p-2">
                                {/* Use generic icon if URL fails, but tried to use standard logos */}
                                <img 
                                    src={connector.iconUrl} 
                                    alt={connector.name} 
                                    className="max-w-full max-h-full"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} 
                                /> 
                                {/* Fallback visual if image breaks */}
                                <div className="hidden">Icon</div> 
                            </div>
                            <h3 className="text-lg font-normal text-gray-900 dark:text-gray-100">{connector.name}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 mt-2 mb-4">
                                {connector.type}
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                {connector.description}
                            </p>
                            
                            <div className="w-full mt-auto">
                                {connector.status === 'disconnected' ? (
                                    <button 
                                        onClick={() => handleConnect(connector.id)}
                                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                    >
                                        Connect
                                    </button>
                                ) : (
                                    <div className="space-y-3 w-full">
                                        <div className="flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-normal">
                                            <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                                            Connected
                                        </div>
                                        {connector.lastSync && (
                                            <p className="text-xs text-gray-400">Last Sync: {new Date(connector.lastSync).toLocaleTimeString()}</p>
                                        )}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button 
                                                onClick={() => handleSync(connector.id)}
                                                disabled={connector.status === 'syncing'}
                                                className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-normal rounded-md text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400"
                                            >
                                                {connector.status === 'syncing' ? (
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : 'Sync Now'}
                                            </button>
                                            <button 
                                                onClick={() => handleDisconnect(connector.id)}
                                                className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-normal rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                            >
                                                Disconnect
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Coming Soon Placeholder */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center opacity-75">
                    <LockClosedIcon className="w-12 h-12 text-gray-400 mb-2" />
                    <h3 className="text-lg font-normal text-gray-600 dark:text-gray-300">More Coming Soon</h3>
                    <p className="text-sm text-gray-500 mt-1">Jira, ServiceNow, AWS, and Azure integrations are in development.</p>
                </div>
            </div>
        </div>
    );
};
