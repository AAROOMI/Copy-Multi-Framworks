
export interface ControlVersion {
  version: string;
  date: string;
  changes: string[];
}

export interface Control {
  id: string;
  description:string;
  relevantTools?: string[]; // Added field for ECC Guide Tools
  implementationGuidelines: string[];
  expectedDeliverables: string[];
  version: string;
  lastUpdated: string;
  history?: ControlVersion[];
}

export interface Subdomain {
  id: string;
  title: string;
  objective: string;
  controls: Control[];
}

export interface Domain {
  id: string;
  name: string;
  subdomains: Subdomain[];
}

export interface SearchResult {
  control: Control;
  subdomain: Subdomain;
  domain: Domain;
}

export interface GeneratedDocsState {
  [controlId: string]: number; // Maps control ID to generation timestamp
}

// --- NEW: Virtual Cybersecurity Department ---
export type OrganizationSize = 'Startup' | 'Mid-Market' | 'Enterprise';

export interface VirtualAgent {
  id: string;
  name: string;
  role: string; // e.g., CTO, CISO
  title: string; // Full title
  description: string; // Short bio for cards
  fullBio: string; // Detailed background for AI Persona
  responsibilities: string[];
  jobAttributes: string[]; // e.g., "Detail Oriented", "Strategic"
  reportingLine: string; // Who they report to (Top-Down approach)
  voiceName: string; // Gemini Voice Name (e.g., 'Puck', 'Kore', 'Fenrir')
  avatarUrl: string;
  capabilities: string[];
  status: 'Idle' | 'Working' | 'Reviewing' | 'Meeting';
  currentTask?: string;
}

export interface DepartmentState {
  orgSize: OrganizationSize;
  agents: VirtualAgent[];
  activeWorkflows: { id: string; title: string; assignedTo: string; status: string }[];
}

// --- NEW: Audit Log System ---

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'DOCUMENT_CREATED'
  | 'DOCUMENT_GENERATED'
  | 'DOCUMENT_APPROVED'
  | 'DOCUMENT_REJECTED'
  | 'COMPANY_PROFILE_UPDATED'
  | 'COMPANY_CREATED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'LICENSE_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'AGENTIC_AUDIT_COMPLETED'
  | 'INTEGRATION_SYNC'
  | 'VAPT_SCAN_STARTED'
  | 'VAPT_REPORT_GENERATED'
  | 'ASSESSMENT_COMPLETED'
  | 'VIRTUAL_DEPT_ACTION'
  | 'RISK_ASSESSMENT_INITIATED'
  | 'ASSET_CREATED'
  | 'ASSET_UPDATED'
  | 'ASSET_DELETED';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: AuditAction;
  details: string;
  targetId?: string; // e.g., user ID, document ID
}


// --- NEW/UPDATED: User Management and RBAC System ---

export type UserRole = 'Administrator' | 'CISO' | 'CTO' | 'CIO' | 'CEO' | 'Security Analyst' | 'Employee';

export type Permission =
  | 'dashboard:read'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'documents:read'
  | 'documents:approve'
  | 'documents:generate'
  | 'templates:read'
  | 'templates:apply'
  | 'navigator:read'
  | 'company:read'
  | 'company:update'
  | 'audit:read'
  | 'assessment:read'
  | 'assessment:update'
  | 'pdplAssessment:read'
  | 'pdplAssessment:update'
  | 'samaCsfAssessment:read'
  | 'samaCsfAssessment:update'
  | 'cmaAssessment:read'
  | 'cmaAssessment:update'
  | 'userProfile:read'
  | 'userProfile:update'
  | 'help:read'
  | 'training:read'
  | 'riskAssessment:read'
  | 'riskAssessment:update'
  | 'complianceAgent:run'
  | 'integrations:manage'
  | 'vapt:manage'
  | 'virtualDept:manage'
  | 'assets:read'
  | 'assets:create'
  | 'assets:update'
  | 'assets:delete';


// User interface with all fields for custom auth
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  accessExpiresAt?: number;
  password?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  passwordResetToken?: string;
  passwordResetExpires?: number;
  companyId?: string;
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  Administrator: [
    'dashboard:read',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'documents:read',
    'documents:approve',
    'documents:generate',
    'templates:read',
    'templates:apply',
    'navigator:read',
    'company:read',
    'company:update',
    'audit:read',
    'assessment:read',
    'assessment:update',
    'pdplAssessment:read',
    'pdplAssessment:update',
    'samaCsfAssessment:read',
    'samaCsfAssessment:update',
    'cmaAssessment:read',
    'cmaAssessment:update',
    'userProfile:read',
    'userProfile:update',
    'help:read',
    'training:read',
    'riskAssessment:read',
    'riskAssessment:update',
    'complianceAgent:run',
    'integrations:manage',
    'vapt:manage',
    'virtualDept:manage',
    'assets:read', 'assets:create', 'assets:update', 'assets:delete'
  ],
  CISO: [
    'dashboard:read',
    'documents:read',
    'documents:approve',
    'documents:generate',
    'templates:read',
    'templates:apply',
    'navigator:read',
    'company:read',
    'audit:read', // Added audit read
    'assessment:read',
    'assessment:update',
    'pdplAssessment:read',
    'pdplAssessment:update',
    'samaCsfAssessment:read',
    'samaCsfAssessment:update',
    'cmaAssessment:read',
    'cmaAssessment:update',
    'userProfile:read',
    'userProfile:update',
    'help:read',
    'training:read',
    'riskAssessment:read',
    'riskAssessment:update',
    'complianceAgent:run',
    'integrations:manage',
    'vapt:manage',
    'virtualDept:manage',
    'assets:read', 'assets:create', 'assets:update', 'assets:delete'
  ],
  CTO: ['dashboard:read', 'documents:read', 'documents:approve', 'navigator:read', 'templates:read', 'company:read', 'assessment:read', 'pdplAssessment:read', 'samaCsfAssessment:read', 'cmaAssessment:read', 'userProfile:read', 'userProfile:update', 'help:read', 'training:read', 'complianceAgent:run', 'integrations:manage', 'virtualDept:manage', 'assets:read', 'assets:create', 'assets:update', 'assets:delete'],
  CIO: ['dashboard:read', 'documents:read', 'documents:approve', 'navigator:read', 'templates:read', 'company:read', 'assessment:read', 'pdplAssessment:read', 'samaCsfAssessment:read', 'cmaAssessment:read', 'userProfile:read', 'userProfile:update', 'help:read', 'training:read', 'complianceAgent:run', 'integrations:manage', 'virtualDept:manage', 'assets:read'],
  CEO: ['dashboard:read', 'documents:read', 'documents:approve', 'navigator:read', 'company:read', 'assessment:read', 'pdplAssessment:read', 'samaCsfAssessment:read', 'cmaAssessment:read', 'userProfile:read', 'userProfile:update', 'help:read', 'training:read', 'virtualDept:manage', 'assets:read'],
  'Security Analyst': [
    'documents:read',
    'documents:generate',
    'templates:read',
    'templates:apply',
    'navigator:read',
    'company:read',
    'assessment:read',
    'assessment:update',
    'pdplAssessment:read',
    'pdplAssessment:update',
    'samaCsfAssessment:read',
    'samaCsfAssessment:update',
    'cmaAssessment:read',
    'cmaAssessment:update',
    'userProfile:read',
    'userProfile:update',
    'help:read',
    'training:read',
    'riskAssessment:read',
    'riskAssessment:update',
    'complianceAgent:run',
    'vapt:manage',
    'virtualDept:manage',
    'assets:read', 'assets:create', 'assets:update'
  ],
  Employee: ['navigator:read', 'company:read', 'userProfile:read', 'userProfile:update', 'help:read', 'training:read'],
};


// Document Management System Types
export type DocumentStatus =
  | 'Draft'
  | 'Pending CISO Approval'
  | 'Pending CTO Approval'
  | 'Pending CIO Approval'
  | 'Pending CEO Approval'
  | 'Approved'
  | 'Rejected';

export interface ApprovalStep {
  role: UserRole;
  decision: 'Approved' | 'Rejected';
  timestamp: number;
  comments?: string;
}

export interface GeneratedContent {
  policy: string;
  procedure: string;
  guideline: string;
}

export type PolicyTone = 'Standard' | 'Formal' | 'Strict' | 'Educational';
export type PolicyLength = 'Standard' | 'Concise' | 'Comprehensive';

export interface DocumentVersion {
    versionId: string;
    timestamp: number;
    content: GeneratedContent;
    tone: string;
    length: string;
    generatedBy: string;
}

export interface AgentSignature {
    agentRole: 'AI CISO' | 'AI CTO' | 'AI Auditor';
    decision: 'Approved' | 'Needs Revision';
    timestamp: number;
    signatureHash: string;
    comments: string;
}

export interface PolicyDocument {
  id: string;
  controlId: string;
  domainName: string;
  subdomainTitle: string;
  controlDescription: string;
  status: DocumentStatus;
  content: GeneratedContent;
  approvalHistory: ApprovalStep[];
  createdAt: number;
  updatedAt: number;
  generatedBy?: 'user' | 'AI Agent';
  versionHistory?: DocumentVersion[];
  agentSignatures?: AgentSignature[]; // New: Stores AI Validation
}

export interface PrebuiltPolicyTemplate {
    id: string;
    title: string;
    description: string;
    content: GeneratedContent;
}

// --- NEW: Subscription Licensing System ---
export interface License {
  key: string;
  status: 'active' | 'expired' | 'inactive';
  expiresAt: number; // Timestamp
  tier: 'monthly' | 'quarterly' | 'semi-annually' | 'yearly' | 'trial';
}

// New type for Company Profile
export interface CompanyProfile {
  id: string;
  name: string;
  logo: string; // base64 encoded image string
  ceoName: string;
  cioName: string;
  cisoName: string;
  ctoName: string;
  cybersecurityOfficerName?: string;
  dpoName?: string;
  complianceOfficerName?: string;
  license?: License;
  ownerId?: string;
  admins?: string[];
}

// --- NEW: NCA ECC Assessment ---
export type ControlStatus = 'Implemented' | 'Partially Implemented' | 'Not Implemented' | 'Not Applicable';

export interface EvidenceValidation {
    isValid: boolean;
    confidence: number;
    reasoning: string;
    analyzedAt: number;
}

export interface AssessmentItem {
  domainCode: string;
  domainName: string;
  subDomainCode: string;
  subdomainName: string;
  controlCode: string;
  controlName: string;
  currentStatusDescription: string;
  controlStatus: ControlStatus;
  recommendation: string;
  managementResponse: string;
  targetDate: string;
  evidence?: {
    fileName: string;
    dataUrl: string; // base64 data URL
    validation?: EvidenceValidation; // New field for AI Audit
  };
}

// --- UPDATED: Training Module ---
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index
}

export interface InteractiveQuiz {
  title: string;
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string; // Markdown content
  quiz?: InteractiveQuiz;
}

export interface TrainingCourse {
  id:string;
  title: string;
  description: string;
  standard: 'NCA ECC' | 'PDPL' | 'SAMA CSF' | 'ISO 27001';
  lessons: Lesson[];
  badgeId: string;
}

export interface UserTrainingProgress {
  [courseId: string]: {
    completedLessons: string[];
    score?: number;
    badgeEarned: boolean;
    badgeId: string;
  };
}

// --- NEW: Interactive Storytelling ---
export interface StoryChoice {
    text: string;
    nextSceneId: string;
    feedback?: string; // What happens immediately after clicking
    isCorrect?: boolean; // For tracking "score" or "good decisions"
}

export interface StoryScene {
    id: string;
    title: string;
    narrative: string;
    imageUrl?: string; // URL for visual context
    choices: StoryChoice[];
}

export interface StoryScenario {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    initialSceneId: string;
    scenes: StoryScene[];
}


// --- NEW: Task Management ---
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Task {
  id: string;
  title: string;
  controlId?: string;
  status: TaskStatus;
  createdAt: number;
}

// FIX: Added missing ChatMessage type for the AI chat widget.
// --- NEW: Chat Widget ---
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// --- NEW: Compliance Agent ---
export interface ComplianceGap {
    controlCode: string;
    controlName: string;
    domainName: string;
    assessedStatus: ControlStatus;
    framework: string;
}

// FIX: Added missing AgentLogEntry type for the Compliance Agent log.
export interface AgentLogEntry {
  id: string;
  timestamp: number;
  message: string;
  status: 'info' | 'working' | 'success' | 'error';
}

// --- NEW: Detailed Risk Assessment ---
export type RiskTreatmentOption = 'Mitigate' | 'Accept' | 'Transfer' | 'Avoid';
export type ControlEffectiveness = 'Effective' | 'Ineffective' | 'Needs Improvement';

export interface Risk {
  id: string;
  // Risk Identification
  title: string;
  description: string;
  category: string; // Risk Category/Source
  owner: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  
  // Risk Analysis
  existingControl: string;
  controlEffectiveness: ControlEffectiveness;
  residualLikelihood: number; // 1-5
  residualImpact: number;     // 1-5
  residualScore: number;      // Calculated
  
  // Risk Treatment
  treatmentOption: RiskTreatmentOption;
  mitigation: string; // Detailed plan/steps
  responsibility: string; // Person assigning to
  progress?: number; // 0-100% of mitigation completion
  
  // Monitoring & Review
  dueDate: string;
  acceptanceCriteria: string;
  approvedBy: string;
  remarks: string;
  
  // Legacy mappings/Helpers
  likelihood: number; // Maps to Residual
  impact: number;     // Maps to Residual
}

// --- VAPT Types ---
export interface VaptFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  asset: string;
  title: string;
  cve: string[];
  cwe: string[];
  cvss: number;
  evidence: {
    scanner_plugin: string;
    observed: string;
    proof: string;
  };
  impact: string;
  recommendation: string;
  references: string[];
}

export interface VaptScanSummary {
  assets_scanned: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

// --- NEW: Asset Inventory ---
export type AssetType = 'Server' | 'Workstation' | 'Network Device' | 'Application' | 'Database' | 'Cloud Resource' | 'Other';
export type AssetCriticality = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  ipAddress?: string;
  macAddress?: string;
  location?: string; // e.g., Data Center, Cloud Region, Office
  owner: string;
  criticality: AssetCriticality;
  lastScanned?: number;
  tags?: string[];
}

// --- NEW: Application Views ---
// This is the centralized source of truth for all navigable pages in the app.
export type View = 
  | 'dashboard' 
  | 'navigator' 
  | 'documents' 
  | 'companyProfile' 
  | 'auditLog' 
  | 'assessment' 
  | 'pdplAssessment' 
  | 'samaCsfAssessment' 
  | 'cmaAssessment' 
  | 'userProfile' 
  | 'help' 
  | 'training' 
  | 'riskAssessment' 
  | 'userManagement' 
  | 'complianceAgent' 
  | 'superAdmin' 
  | 'sarahAgent'
  | 'integrations'
  | 'vapt'
  | 'virtualDepartment'
  | 'assets'; // Added new view

export interface LiveAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (view: View) => void;
  hidden?: boolean;
  currentUser: User | null;
  activeAgent?: VirtualAgent | null; // For specific agent consultation
  
  // Data for "Brain" Context
  risks: Risk[];
  eccAssessment: AssessmentItem[];
  pdplAssessment: AssessmentItem[];
  samaCsfAssessment: AssessmentItem[];
  cmaAssessment: AssessmentItem[];
  auditLog: AuditLogEntry[];
  documents: PolicyDocument[];
  
  // Actions
  onAddRisk?: (category: string, risk: Omit<Risk, 'id'>) => void;
  onGenerateReport?: () => void;
  onInitiateAssessment?: (type: 'ecc' | 'pdpl' | 'sama' | 'cma') => void;
  onDelegateTask?: (agentName: string, task: string) => void; // New for Virtual Dept
}
