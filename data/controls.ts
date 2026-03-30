
import type { Domain, Control } from '../types';

// Helper to generate a control
const createControl = (id: string, description: string): Control => ({
    id,
    description,
    relevantTools: ['Standard Policy Template'],
    implementationGuidelines: [
        'Define and document requirements.',
        'Implement requirements according to approved procedures.',
        'Review periodically (e.g., annually).'
    ],
    expectedDeliverables: [
        'Approved Policy/Standard.',
        'Implementation Evidence.'
    ],
    version: '1.0',
    lastUpdated: '2024-01-01'
});

// Helper to generate a subdomain with a range of controls
const createSubdomain = (id: string, title: string, objective: string, controlCount: number, startControlIndex: number = 1) => {
    const controls: Control[] = [];
    for (let i = 0; i < controlCount; i++) {
        controls.push(createControl(`${id}-${startControlIndex + i}`, `Control ${id}-${startControlIndex + i}: ${title} Requirement`));
    }
    return { id, title, objective, controls };
};

export const eccData: Domain[] = [
  {
    id: '1',
    name: 'Cybersecurity Governance',
    // Requested: 10 Subdomains, 51 Controls Total
    subdomains: [
        createSubdomain('1-1', 'Cybersecurity Strategy', 'Ensure plans contribute to compliance.', 3),
        createSubdomain('1-2', 'Cybersecurity Management', 'Ensure support in implementing programs.', 4),
        createSubdomain('1-3', 'Cybersecurity Policies and Procedures', 'Ensure requirements are documented.', 5),
        createSubdomain('1-4', 'Cybersecurity Roles and Responsibilities', 'Ensure roles are defined.', 4),
        createSubdomain('1-5', 'Cybersecurity Risk Management', 'Manage risks methodologically.', 5),
        createSubdomain('1-6', 'Cybersecurity in IT Project Management', 'Include security in projects.', 5),
        createSubdomain('1-7', 'Compliance with Standards and Laws', 'Ensure regulatory compliance.', 4),
        createSubdomain('1-8', 'Periodical Cybersecurity Review', 'Ensure effective implementation.', 5),
        createSubdomain('1-9', 'Cybersecurity in Human Resources', 'Manage personnel risks.', 8),
        createSubdomain('1-10', 'Cybersecurity Awareness and Training', 'Ensure personnel awareness.', 8) 
        // Total: 3+4+5+4+5+5+4+5+8+8 = 51 Controls
    ]
  },
  {
    id: '2',
    name: 'Cybersecurity Defense',
    // Requested: 15 Subdomains, 110 Controls Total
    subdomains: [
        createSubdomain('2-1', 'Asset Management', 'Ensure accurate inventory.', 8),
        createSubdomain('2-2', 'Identity and Access Management', 'Secure logical access.', 10),
        createSubdomain('2-3', 'Information System Protection', 'Protect systems from risks.', 10),
        createSubdomain('2-4', 'Email Protection', 'Protect email services.', 5),
        createSubdomain('2-5', 'Networks Security Management', 'Protect network infrastructure.', 8),
        createSubdomain('2-6', 'Mobile Devices Security', 'Protect mobile and BYOD.', 5),
        createSubdomain('2-7', 'Data and Information Protection', 'Ensure data confidentiality.', 8),
        createSubdomain('2-8', 'Cryptography', 'Ensure proper use of crypto.', 6),
        createSubdomain('2-9', 'Backup and Recovery Management', 'Ensure data recovery.', 5),
        createSubdomain('2-10', 'Vulnerabilities Management', 'Detect and remediate flaws.', 6),
        createSubdomain('2-11', 'Penetration Testing', 'Simulate attacks to find weaknesses.', 5),
        createSubdomain('2-12', 'Event Logs and Monitoring', 'Collect and analyze events.', 8),
        createSubdomain('2-13', 'Incident and Threat Management', 'Handle incidents effectively.', 8),
        createSubdomain('2-14', 'Physical Security', 'Protect assets physically.', 8),
        createSubdomain('2-15', 'Web Application Security', 'Protect web apps.', 10)
        // Total: 8+10+10+5+8+5+8+6+5+6+5+8+8+8+10 = 110 Controls
    ]
  },
  {
      id: '3',
      name: 'Cybersecurity Resilience',
      // Requested: ~13 Controls
      subdomains: [
          createSubdomain('3-1', 'Business Continuity Management (BCM)', 'Integrate security into BCM.', 7),
          createSubdomain('3-2', 'Disaster Recovery Management', 'Ensure recovery capabilities.', 6)
          // Total: 13 Controls
      ]
  },
  {
      id: '4',
      name: 'Third-Party and Cloud Cybersecurity',
      // Requested: 6 Controls
      subdomains: [
          createSubdomain('4-1', 'Third-Party Cybersecurity', 'Manage third-party risks.', 3),
          createSubdomain('4-2', 'Cloud Computing and Hosting', 'Secure cloud services.', 3)
          // Total: 6 Controls
      ]
  },
  {
      id: '5',
      name: 'ICS Cybersecurity',
      // Requested: 1 Subdomain, 13 Controls
      subdomains: [
          createSubdomain('5-1', 'Industrial Control Systems Protection', 'Protect OT/ICS environments.', 13)
          // Total: 13 Controls
      ]
  }
];
