
import type { Risk } from '../types';

export const initialRiskData: Risk[] = [
    { 
        id: 'ns1', 
        title: 'Firewall Breach',
        description: 'Unauthorized access to internal network via unpatched firewall vulnerability.', 
        category: 'Network Security',
        owner: 'IT Security Manager',
        inherentLikelihood: 4,
        inherentImpact: 5,
        inherentScore: 20,
        existingControl: 'Basic Firewall Rules',
        controlEffectiveness: 'Needs Improvement',
        residualLikelihood: 3, 
        residualImpact: 5, 
        residualScore: 15,
        likelihood: 3, // Legacy mapping
        impact: 5,     // Legacy mapping
        treatmentOption: 'Mitigate',
        mitigation: 'Implement automated patch management system and conduct quarterly firewall rule reviews.', 
        responsibility: 'Network Admin',
        dueDate: '2024-12-31',
        acceptanceCriteria: 'Zero high-risk vulnerabilities on external scan.',
        approvedBy: 'CISO',
        remarks: 'Budget approved for new firewall license.'
    },
    { 
        id: 'ds1', 
        title: 'Database Leak',
        description: 'Sensitive customer data leakage from production database due to misconfiguration.', 
        category: 'Data Security',
        owner: 'Database Administrator',
        inherentLikelihood: 3,
        inherentImpact: 5,
        inherentScore: 15,
        existingControl: 'Access Control Lists',
        controlEffectiveness: 'Effective',
        residualLikelihood: 2, 
        residualImpact: 4, 
        residualScore: 8,
        likelihood: 2,
        impact: 4,
        treatmentOption: 'Mitigate',
        mitigation: 'Implement Data Loss Prevention (DLP) solution and encrypt database at rest.', 
        responsibility: 'DBA Team Lead',
        dueDate: '2024-11-15',
        acceptanceCriteria: 'All PII data encrypted.',
        approvedBy: 'CIO',
        remarks: 'Pending vendor selection for DLP.'
    },
];

export const likelihoodOptions = [
    { value: 1, label: '1 - Rare' }, 
    { value: 2, label: '2 - Unlikely' }, 
    { value: 3, label: '3 - Possible' }, 
    { value: 4, label: '4 - Likely' },
    { value: 5, label: '5 - Almost Certain' }
];
export const impactOptions = [
    { value: 1, label: '1 - Insignificant' },
    { value: 2, label: '2 - Minor' },
    { value: 3, label: '3 - Moderate' },
    { value: 4, label: '4 - Major' },
    { value: 5, label: '5 - Catastrophic' }
];
