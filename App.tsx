
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AIService } from './services/aiService';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './components/Dashboard';
import { DocumentsPage } from './components/DocumentsPage';
import { ContentView } from './components/ContentView';
import { CompanyProfilePage } from './components/CompanyProfilePage';
import { AuditLogPage } from './components/AuditLogPage';
import { UserManagementPage } from './components/UserManagementPage';
import { LoginPage } from './components/LoginPage';
import { CompanySetupPage } from './components/CompanySetupPage';
import { AssessmentPage } from './components/AssessmentPage';
import { PDPLAssessmentPage } from './components/PDPLAssessmentPage';
import { SamaCsfAssessmentPage } from './components/SamaCsfAssessmentPage';
import { CMAAssessmentPage } from './components/CMAAssessmentPage';
import { UserProfilePage } from './components/UserProfilePage';
import { HelpSupportPage } from './components/HelpSupportPage';
import { TrainingPage } from './components/TrainingPage';
import { RiskAssessmentPage } from './components/RiskAssessmentPage';
import { ComplianceAgentPage } from './components/ComplianceAgentPage';
import { LiveVoiceDemoPage } from './components/LiveVoiceDemoPage';
import { SuperAdminPage } from './components/SuperAdminPage';
import { IntegrationsPage } from './components/IntegrationsPage';
import { VaptOrchestratorPage } from './components/VaptOrchestratorPage';
import { AssetInventoryPage } from './components/AssetInventoryPage';
import { VirtualDepartmentPage } from './components/VirtualDepartmentPage';
import { MeetingRoomPage } from './components/MeetingRoomPage';
import { MultiplayerWhiteboard } from './components/MultiplayerWhiteboard';
import { CreatorMarketplace } from './components/CreatorMarketplace';
import { DidEmbed } from './components/DidEmbed';
import { LiveAssistantWidget } from './components/LiveAssistantWidget';
import { SparklesIcon } from './components/Icons';
import { MfaSetupPage } from './components/MfaSetupPage';
import { MfaVerifyPage } from './components/MfaVerifyPage';
import { TourGuide } from './components/TourGuide';
import { TrainingAssistant } from './components/TrainingAssistant';
import { RiskAssistant } from './components/RiskAssistant';
import { BreadcrumbReferenceSheet } from './components/BreadcrumbReferenceSheet';
import { AccordionShowcase } from './components/AccordionShowcase';
import { GemmaEnginePage } from './components/GemmaEnginePage';
import { SuperTestAgentPage } from './components/SuperTestAgentPage';
import { useAdminSessionTimeout } from './components/useAdminSessionTimeout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAiOrchestrator } from './hooks/useAiOrchestrator';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { eccData } from './data/controls';
import { dbAPI } from './db';
import { virtualAgents } from './data/virtualAgents';
import { translations } from './translations';
import { 
  rolePermissions, 
  type User, 
  type View, 
  type Domain, 
  type Control, 
  type Subdomain, 
  type GeneratedContent, 
  type PolicyDocument, 
  type CompanyProfile, 
  type AuditAction, 
  type AssessmentItem, 
  type Risk, 
  type ComplianceGap, 
  type Task, 
  type AgentLogEntry, 
  type UserTrainingProgress,
  type Permission,
  type VirtualAgent,
  type Asset,
  type PolicyTone,
  type PolicyLength
} from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentView, setCurrentView] = useState<View>(() => {
    if (window.location.pathname === '/admin/dashboard') {
      return 'superAdmin';
    }
    return 'creatorMarketplace';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [language, setLanguage] = useState<'en' | 'ar'>(() => {
    return (localStorage.getItem('app_lang') as 'en' | 'ar') || 'en';
  });

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  
  // Data State
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [eccAssessment, setEccAssessment] = useState<AssessmentItem[]>([]);
  const [pdplAssessment, setPdplAssessment] = useState<AssessmentItem[]>([]);
  const [samaCsfAssessment, setSamaCsfAssessment] = useState<AssessmentItem[]>([]);
  const [cmaAssessment, setCmaAssessment] = useState<AssessmentItem[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agentLog, setAgentLog] = useState<AgentLogEntry[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<UserTrainingProgress>({});
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assessmentStatuses, setAssessmentStatuses] = useState<Record<string, string>>({});

  // UI State
  const [selectedDomain, setSelectedDomain] = useState<Domain>(eccData[0]);
  const [activeControlId, setActiveControlId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'info' | 'error'}[]>([]);
  const [showLiveAssistant, setShowLiveAssistant] = useState(false);
  const [isHeadlessMode, setIsHeadlessMode] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState('idle');
  const [showTour, setShowTour] = useState(false);
  const [activeVirtualAgent, setActiveVirtualAgent] = useState<VirtualAgent | null>(null);
  
  // MFA State
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showMfaVerify, setShowMfaVerify] = useState(false);
  const [pendingMfaUser, setPendingMfaUser] = useState<User | null>(null);

  // Computed Permissions
  const permissions = useMemo(() => {
    if (currentUser?.isSuperUser) {
      return new Set(rolePermissions['Super Admin']);
    }
    return new Set(currentUser ? rolePermissions[currentUser.role] : []);
  }, [currentUser]);

  // --- Initialization ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      try {
        if (firebaseUser) {
          let user = await dbAPI.getUser(firebaseUser.uid, firebaseUser.email || undefined);
          if (!user) {
            // Create default profile if missing during refresh
            user = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: firebaseUser.email === 'aaroomi@gmail.com' ? 'internal_admin' : (firebaseUser.email === 'aerummi@gmail.com' ? 'Super Admin' : 'Security Analyst'),
              isVerified: true,
              companyId: 'demo-company',
              mfaEnabled: false
            };
            try {
              await dbAPI.createUser(user, 'demo-company');
            } catch (err) {
              console.error("Failed to auto-create user profile:", err);
            }
          }

          if (user) {
            // ADMIN OVERRIDE
            if (user.email === 'aaroomi@gmail.com') {
              user.role = 'internal_admin';
            } else if (user.email === 'aerummi@gmail.com') {
              user.role = 'Super Admin';
            }
            
            if (user.mfaEnabled) {
              setPendingMfaUser(user);
              setShowMfaVerify(true);
            } else {
              await loadCompanyData(user);
              if (user.role === 'Super Admin' || user.role === 'internal_admin') {
                setCurrentView('superAdmin');
                if (window.location.pathname !== '/admin/dashboard') {
                  window.history.pushState({}, "", "/admin/dashboard");
                }
                console.log("Authenticated User:", user.email);
                console.log("Role:", user.role);
                console.log("Redirecting to:", "/admin/dashboard");
                console.log("Session:", auth.currentUser);
              }
            }
          }
        } else {
          // Fallback for simulated super admin session
          const silentUser = await dbAPI.loginUser('', ''); // Trigger silent check (includes simulation)
          if (silentUser) {
              await loadCompanyData(silentUser);
              if (silentUser.role === 'Super Admin' || silentUser.role === 'internal_admin') {
                  setCurrentView('superAdmin');
                  if (window.location.pathname !== '/admin/dashboard') {
                    window.history.pushState({}, "", "/admin/dashboard");
                  }
                  console.log("Authenticated User:", silentUser.email);
                  console.log("Role:", silentUser.role);
                  console.log("Redirecting to:", "/admin/dashboard");
                  console.log("Session:", auth.currentUser);
              }
          } else {
              setCurrentUser(null);
              setCompany(null);
          }
        }
      } catch (authErr) {
        console.error("Error in onAuthStateChanged wrapper:", authErr);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Routing sync from view and pathname + Protected Route Access Guards
  useEffect(() => {
    const handleNavigationSecurity = () => {
      const path = window.location.pathname;
      if (currentUser) {
        if (currentUser.role === 'internal_admin' || currentUser.role === 'Super Admin' || currentUser.email === 'aaroomi@gmail.com') {
          // Rule: If internal_admin/Super Admin, force redirect to /admin/dashboard
          if (currentView !== 'superAdmin') {
            setCurrentView('superAdmin');
          }
          if (path !== '/admin/dashboard') {
            window.history.pushState({}, "", "/admin/dashboard");
          }
        } else {
          // Rule: If a normal user tries to access /admin/dashboard, force redirect to home and dashboard view
          if (path === '/admin/dashboard') {
            window.history.pushState({}, "", "/");
            setCurrentView('dashboard');
          }
        }
      }
    };
    handleNavigationSecurity();
    window.addEventListener('popstate', handleNavigationSecurity);
    return () => window.removeEventListener('popstate', handleNavigationSecurity);
  }, [currentUser, currentView, isLoading]);

  // Synchronize URL from view state changes
  useEffect(() => {
    if (currentView === 'superAdmin') {
      if (window.location.pathname !== '/admin/dashboard') {
        window.history.pushState({}, "", "/admin/dashboard");
      }
    } else {
      // Only redirect /admin/dashboard to / if the current user is NOT an admin
      const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'internal_admin' || currentUser?.email === 'aaroomi@gmail.com';
      if (window.location.pathname === '/admin/dashboard' && !isAdmin && !isLoading) {
        window.history.pushState({}, "", "/");
      }
    }
  }, [currentView, currentUser, isLoading]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const loadCompanyData = async (user: User) => {
    // Fallback for Super Admin if companyId is missing, or for specific user
    let effectiveCompanyId = user.companyId;
    if (!effectiveCompanyId || user.role === 'Super Admin' || user.role === 'internal_admin' || user.email === 'aaroomi@gmail.com' || user.email === 'aerummi@gmail.com') {
      effectiveCompanyId = 'demo-company';
    }

    try {
        setIsLoading(true);
        const data = await dbAPI.getCompanyData(effectiveCompanyId);
        setCompany(data.companyProfile);
        setUsers(data.users);
        setDocuments(data.documents);
        setAuditLog(data.auditLog);
        setTasks(data.tasks);
        setAgentLog(data.agentLog);
        setEccAssessment(data.eccAssessment);
        setPdplAssessment(data.pdplAssessment);
        setSamaCsfAssessment(data.samaCsfAssessment);
        setCmaAssessment(data.cmaAssessment);
        setRisks(data.riskAssessmentData);
        setAssets(data.assets);
        setTrainingProgress(data.trainingProgress);
        setAssessmentStatuses(data.assessmentStatuses);
        setCurrentUser(user);
    } catch (error) {
        console.error("Failed to load company data", error);
        addNotification("Failed to load application data. Using demo session.", "info");
        // Fallback to demo data if live load fails
        const demoData = await dbAPI.getCompanyData('demo-company');
        setCompany(demoData.companyProfile);
        setUsers(demoData.users);
        setDocuments(demoData.documents);
        setAuditLog(demoData.auditLog);
        setTasks(demoData.tasks);
        setAgentLog(demoData.agentLog);
        setEccAssessment(demoData.eccAssessment);
        setPdplAssessment(demoData.pdplAssessment);
        setSamaCsfAssessment(demoData.samaCsfAssessment);
        setCmaAssessment(demoData.cmaAssessment);
        setRisks(demoData.riskAssessmentData);
        setAssets(demoData.assets);
        setTrainingProgress(demoData.trainingProgress);
        setAssessmentStatuses(demoData.assessmentStatuses);
        setCurrentUser(user);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectDomain = (domain: Domain) => {
    setSelectedDomain(domain);
    setCurrentView('navigator');
    setActiveControlId(null);
  };

  const addNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const {
    isOnline: aiOrchestratorOnline,
    isOfflineActive,
    queueAuditLog,
    syncOfflineLogs
  } = useAiOrchestrator(
    company?.id,
    addNotification,
    (syncedLogs) => {
      setAuditLog(prev => {
        const existingIds = new Set(prev.map(l => l.id));
        const filteredSynced = syncedLogs.filter(l => !existingIds.has(l.id));
        return [...filteredSynced, ...prev];
      });
    }
  );

  useEffect(() => {
    setIsOnline(aiOrchestratorOnline && !isOfflineActive);
  }, [aiOrchestratorOnline, isOfflineActive]);

  // Monitor the tasks state and trigger automatic notifications for stale high-priority pending/todo tasks
  const notifiedTasksRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    tasks.forEach(task => {
      // High-priority checks (either priority property is 'high'/'High', or title/description mentions it)
      const isHighPriority = 
        (task as any).priority === 'high' || 
        (task as any).priority === 'High' ||
        String(task.title || '').toLowerCase().includes('high priority') ||
        String(task.title || '').toLowerCase().includes('[high]') ||
        (task as any).description && String((task as any).description || '').toLowerCase().includes('high priority');

      // Status checks: 'Pending' or 'To Do'
      const isPending = task.status === 'Pending' || task.status === 'To Do';

      // Age checks: 48 hours is 172800000 ms
      const ageMs = Date.now() - task.createdAt;
      const isStale = ageMs > 172800000;

      if (isHighPriority && isPending && isStale) {
        if (!notifiedTasksRef.current.has(task.id)) {
          notifiedTasksRef.current.add(task.id);
          addNotification(
            `Escalation Alert: High-priority task "${task.title}" has remained in Pending status for over 48 hours!`,
            'error'
          );
        }
      }
    });
  }, [tasks]);

  const handleAddAuditLog = (action: AuditAction, details: string, targetId?: string) => {
    if (!currentUser || !company) return;
    const entry = {
        id: `audit-${Date.now()}`,
        timestamp: Date.now(),
        userId: currentUser.id,
        userName: currentUser.name,
        action,
        details,
        targetId
    };
    setAuditLog(prev => [entry, ...prev]);
    if (isOfflineActive) {
        queueAuditLog(entry);
    } else {
        dbAPI.addAuditLog(company.id, entry);
    }
  };

  // --- Auth Handlers ---

  const handleLogin = async (email: string, password: string): Promise<{error: string, code?: string} | null> => {
    try {
        setIsLoading(true);
        const user = await dbAPI.loginUser(email, password);
        if (user) {
            if (!user.isVerified) {
                setIsLoading(false);
                return { error: "Email not verified.", code: 'unverified' };
            }
            if (user.accessExpiresAt && user.accessExpiresAt < Date.now()) {
                setIsLoading(false);
                return { error: "Account access expired.", code: 'expired' };
            }
            
            if (user.mfaEnabled) {
                setPendingMfaUser(user);
                setShowMfaVerify(true);
                setIsLoading(false);
                return null;
            }
            
            // Unconditionally load company data immediately during login to guarantee matching state and avoid race conditions
            await loadCompanyData(user);

            if (user.role === 'Super Admin' || user.role === 'internal_admin') {
                setCurrentView('superAdmin');
                if (window.location.pathname !== '/admin/dashboard') {
                  window.history.pushState({}, "", "/admin/dashboard");
                }
                console.log("Authenticated User:", user.email);
                console.log("Role:", user.role);
                console.log("Redirecting to:", "/admin/dashboard");
                console.log("Session:", auth.currentUser);
            }
            
            handleAddAuditLog('USER_LOGIN', `User ${user.email} logged in.`);
            return null;
        }
        setIsLoading(false);
        return { error: "Invalid credentials." };
    } catch (error: any) {
        setIsLoading(false);
        return { error: error.message || "An unexpected error occurred during login." };
    }
  };

  const handleGoogleLogin = async (): Promise<{error: string} | null> => {
    try {
        const user = await dbAPI.loginWithGoogle();
        if (user) {
            await loadCompanyData(user);
            handleAddAuditLog('USER_LOGIN', `User ${user.email} logged in via Google.`);
            return null;
        }
        return { error: "Google login failed." };
    } catch (error: any) {
        return { error: error.message || "Google login failed." };
    }
  };

  const handleMetaMaskLogin = async (address: string): Promise<{error: string} | null> => {
    try {
        // In this app, we associate the wallet with an existing user or create a session.
        // For demo, we'll try to find a user with this "address" or just login as admin if it matches a known one,
        // or just simulate a successful login for the demo session.
        console.log("Logged in with MetaMask address:", address);
        
        // Find user by address or role
        let user = users.find(u => u.id === address); // Simple mock
        if (!user) {
            // For demo, if MetaMask connects, we give them a temporary session if not in DB
            user = {
                id: address,
                name: `Web3 User (${address.slice(0, 6)}...)`,
                email: `${address.slice(0, 6)}@metamask.io`,
                role: 'Security Analyst',
                isVerified: true,
                companyId: company?.id || 'demo-company'
            };
        }
        
        await loadCompanyData(user);
        handleAddAuditLog('USER_LOGIN', `User ${user.name} logged in via MetaMask.`);
        return null;
    } catch (error: any) {
        return { error: error.message || "MetaMask login failed on server." };
    }
  };

  const handleMfaVerify = async (userId: string, code: string) => {
      // In a real app, verify TOTP code here. Mocking success for demo.
      if (code === '123456') {
          if (pendingMfaUser) {
              await loadCompanyData(pendingMfaUser);
              setShowMfaVerify(false);
              setPendingMfaUser(null);
              return { success: true };
          }
      }
      return { success: false, message: "Invalid code" };
  };

  const handleLogout = async () => {
    if (currentUser) handleAddAuditLog('USER_LOGOUT', `User ${currentUser.email} logged out.`);
    await dbAPI.logoutUser();
    setCurrentUser(null);
    setCompany(null);
    setShowMfaVerify(false);
    setCurrentView('dashboard');
  };

  // Automated admin inactivity detection & session management
  useAdminSessionTimeout(currentUser, handleLogout, addNotification);

  const handleSetupCompany = async (profileData: any, adminData: any) => {
      // Temporary license
      const license = { key: `TRIAL-${Date.now()}`, status: 'active' as const, tier: 'trial' as const, expiresAt: Date.now() + 7*24*60*60*1000 };
      try {
        await dbAPI.createCompanySystem(profileData, { ...adminData, password: adminData.password }, license);
        // Auto login after creation
        await handleLogin(adminData.email, adminData.password);
      } catch (e: any) {
          addNotification(e.message, 'error');
      }
  };

  // --- Document & AI Handlers ---

  const handleGeneratePolicyWithAI = async (control: Control, subdomain: Subdomain, domain: Domain, tone: PolicyTone, length: PolicyLength) => {
      if (!company) return;
      
      const prompt = `
        Generate a comprehensive cybersecurity policy document for the following control:
        Control ID: ${control.id}
        Description: ${control.description}
        Domain: ${domain.name}
        Subdomain: ${subdomain.title}
        Company Name: ${company.name}
        
        Guidelines to include: ${control.implementationGuidelines.join('; ')}
        Deliverables required: ${control.expectedDeliverables.join('; ')}
        
        Tone: ${tone}
        Length: ${length}
        
        Format as JSON with keys: 'policy', 'procedure', 'guideline'. Content should be Markdown.
      `;

      try {
          const response = await AIService.generateStructuredContent(prompt, { 
              policy: 'string', 
              procedure: 'string', 
              guideline: 'string' 
          });
          
          if (!response) throw new Error("Empty response from AI Service");
          
          const content = response as unknown as GeneratedContent;
          
          const newDoc: PolicyDocument = {
              id: `doc-${Date.now()}`,
              controlId: control.id,
              domainName: domain.name,
              subdomainTitle: subdomain.title,
              controlDescription: control.description,
              status: 'Draft',
              content: content,
              approvalHistory: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              generatedBy: 'AI Agent'
          };
          
          setDocuments(prev => [...prev, newDoc]);
          dbAPI.saveDocument(company.id, newDoc);
          addNotification(`Document for ${control.id} generated successfully.`, 'success');
          handleAddAuditLog('DOCUMENT_GENERATED', `AI generated document for ${control.id}`);
          
      } catch (error) {
          console.error("AI Generation Error", error);
          addNotification("Failed to generate document.", "error");
      }
  };

  const handleAddDocument = (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent) => {
      if (!company) return;
      const newDoc: PolicyDocument = {
          id: `doc-${Date.now()}`,
          controlId: control.id,
          domainName: domain.name,
          subdomainTitle: subdomain.title,
          controlDescription: control.description,
          status: 'Draft',
          content: generatedContent,
          approvalHistory: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          generatedBy: 'user'
      };
      setDocuments(prev => [...prev, newDoc]);
      dbAPI.saveDocument(company.id, newDoc);
      handleAddAuditLog('DOCUMENT_CREATED', `Document created for ${control.id}`);
  };

  const handleApprovalAction = (documentId: string, decision: 'Approved' | 'Rejected', comments?: string) => {
      if (!currentUser || !company) return;
      
      setDocuments(prev => prev.map(doc => {
          if (doc.id === documentId) {
              const newStatus = decision === 'Rejected' ? 'Rejected' : 
                                doc.status === 'Draft' ? 'Pending CISO Approval' :
                                doc.status === 'Pending CISO Approval' ? 'Pending CTO Approval' :
                                doc.status === 'Pending CTO Approval' ? 'Pending CIO Approval' :
                                doc.status === 'Pending CIO Approval' ? 'Pending CEO Approval' : 'Approved';
                                
              const updatedDoc = {
                  ...doc,
                  status: newStatus as any,
                  approvalHistory: [...doc.approvalHistory, { role: currentUser.role, decision, timestamp: Date.now(), comments }],
                  updatedAt: Date.now()
              };
              dbAPI.updateDocument(company.id, updatedDoc);
              handleAddAuditLog(decision === 'Approved' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED', `${decision} document ${doc.controlId}`);
              return updatedDoc;
          }
          return doc;
      }));
  };

  const handleUpdateDocument = (updatedDoc: PolicyDocument) => {
      if (!company) return;
      setDocuments(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
      dbAPI.updateDocument(company.id, updatedDoc);
      handleAddAuditLog('DOCUMENT_UPDATED', `Document updated for ${updatedDoc.controlId}`);
  };

  // --- Render ---

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-teal-600"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
  }

  if (!currentUser || !company) {
      return (
        <div className={theme}>
            <LoginPage 
                onLogin={handleLogin} 
                onMetaMaskLogin={handleMetaMaskLogin}
                onGoogleLogin={handleGoogleLogin}
                theme={theme} 
                toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
                onSetupCompany={() => setCurrentView('companySetup')} 
                onVerify={() => true} 
                onForgotPassword={dbAPI.sendPasswordResetLink.bind(dbAPI)}
                onResetPassword={dbAPI.resetPassword.bind(dbAPI)}
            />
            {currentView === 'companySetup' && (
                <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
                    <CompanySetupPage 
                        onSetup={handleSetupCompany} 
                        onCancel={() => setCurrentView('dashboard')} 
                        theme={theme} 
                        toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
                    />
                </div>
            )}
            {showMfaVerify && pendingMfaUser && (
                <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
                    <MfaVerifyPage 
                        user={pendingMfaUser} 
                        onVerify={handleMfaVerify} 
                        onCancel={() => { setShowMfaVerify(false); setPendingMfaUser(null); }} 
                        theme={theme} 
                        toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
                    />
                </div>
            )}
        </div>
      );
  }

  return (
    <ErrorBoundary>
      <div className={`flex h-screen bg-transparent text-slate-100 font-sans transition-colors duration-200 ${theme}`}>
      <Sidebar 
        domains={eccData} 
        selectedDomain={selectedDomain} 
        onSelectDomain={handleSelectDomain} 
        currentView={currentView}
        onSetView={setCurrentView}
        permissions={permissions}
        trainingProgress={trainingProgress}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="glass-panel border-white/5 h-[58px] m-4 mb-0 flex justify-between items-center px-6 shadow-2xl z-20">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 rounded-md hover:bg-white/10 text-white/70">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
                <div className="flex flex-col">
                    <h2 className="text-[13px] font-medium text-white/90 leading-tight uppercase tracking-tight">{company.name}</h2>
                    <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">Cybersecurity Navigator</span>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="hidden lg:flex items-center gap-4 border-r border-white/5 pr-6 mr-2">
                    <button
                        onClick={() => {
                            setIsHeadlessMode(true);
                            setShowLiveAssistant(true);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${
                            showLiveAssistant && isHeadlessMode 
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 animate-pulse' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white/80'
                        }`}
                        title="Navigate with voice"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Voice</span>
                    </button>
                    <button
                        onClick={() => {
                            setIsHeadlessMode(false);
                            setShowLiveAssistant(true);
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <SparklesIcon className="w-3 h-3" />
                        Live Assistant
                    </button>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        {theme === 'light' ? 
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> : 
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        }
                    </button>
                    {!isOnline ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 shadow-sm shadow-amber-500/10">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Edge-AI Optimized fallback active</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 shadow-sm shadow-teal-500/10">
                            <div className="flex gap-0.5">
                                <div className="w-1 h-1 bg-teal-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-teal-400 rounded-full animate-bounce"></div>
                                <div className="w-1 h-1 bg-teal-400 rounded-full"></div>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Neural-Link: Cloud Verified</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        <span className="text-[9px] font-bold uppercase tracking-wider">Local LLM: Ready</span>
                    </div>
                    <button onClick={handleLogout} className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 transition-colors ml-2">Secure Terminate</button>
                </div>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative">
            <div className="max-w-[1600px] mx-auto h-full space-y-6">
                <div className="glass-panel border-white/5 min-h-full p-6 bg-white/[0.02] flex flex-col">
                    {currentView === 'saraAgent' && <DidEmbed />}
                    {currentView === 'dashboard' && (
                        <DashboardPage 
                            repository={documents} 
                            currentUser={currentUser} 
                            allControls={eccData.flatMap(d => d.subdomains.flatMap(s => s.controls.map(c => ({ control: c, subdomain: s, domain: d }))))}
                            domains={eccData}
                            onSetView={setCurrentView}
                            onSelectDomain={handleSelectDomain}
                            trainingProgress={trainingProgress}
                            eccAssessment={eccAssessment}
                            pdplAssessment={pdplAssessment}
                            samaCsfAssessment={samaCsfAssessment}
                            cmaAssessment={cmaAssessment}
                            tasks={tasks}
                            setTasks={setTasks}
                            risks={risks}
                        />
                    )}
            {currentView === 'navigator' && (
                <ContentView 
                    domain={selectedDomain}
                    activeControlId={activeControlId}
                    setActiveControlId={setActiveControlId}
                    onAddDocument={handleAddDocument}
                    onGeneratePolicyWithAI={handleGeneratePolicyWithAI}
                    documentRepository={documents}
                    permissions={permissions}
                    onSetView={setCurrentView}
                    onUpdateDocument={handleUpdateDocument}
                />
            )}
            {currentView === 'documents' && (
                <DocumentsPage 
                    repository={documents} 
                    currentUser={currentUser} 
                    onApprovalAction={handleApprovalAction} 
                    onAddDocument={handleAddDocument}
                    permissions={permissions}
                    company={company}
                />
            )}
            {currentView === 'companyProfile' && (
                <CompanyProfilePage 
                    company={company} 
                    onSave={(updated) => { setCompany(updated); dbAPI.updateCompanyProfile(updated); }} 
                    canEdit={permissions.has('company:update')}
                    addNotification={addNotification}
                    currentUser={currentUser}
                    onSetupCompany={handleSetupCompany}
                />
            )}
            {currentView === 'auditLog' && <AuditLogPage auditLog={auditLog} />}
            {currentView === 'userManagement' && (
                <UserManagementPage 
                    users={users} 
                    setUsers={setUsers} 
                    currentUser={currentUser} 
                    addNotification={addNotification}
                    addAuditLog={handleAddAuditLog}
                    onUserCreate={(u) => dbAPI.createUser(u, company.id)}
                    onUserUpdate={dbAPI.updateUser}
                    onUserDelete={dbAPI.deleteUser}
                />
            )}
            {currentView === 'assessment' && (
                <AssessmentPage 
                    assessmentData={eccAssessment}
                    onUpdateItem={(code, item) => {
                        const updated = eccAssessment.map(i => i.controlCode === code ? item : i);
                        setEccAssessment(updated);
                        dbAPI.saveAssessmentItems(company.id, 'ecc', updated);
                    }}
                    status={assessmentStatuses.ecc as any || 'idle'}
                    onInitiate={() => {
                        setAssessmentStatuses(prev => ({...prev, ecc: 'in-progress'}));
                        dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, ecc: 'in-progress'});
                    }}
                    onComplete={() => {
                        setAssessmentStatuses(prev => ({...prev, ecc: 'completed'}));
                        dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, ecc: 'completed'});
                        handleAddAuditLog('ASSESSMENT_COMPLETED', 'ECC Assessment Completed');
                    }}
                    permissions={permissions}
                    onSetView={setCurrentView as any}
                    onGenerateReport={() => {}}
                />
            )}
            {currentView === 'pdplAssessment' && (
                <PDPLAssessmentPage
                    assessmentData={pdplAssessment}
                    onUpdateItem={(code, item) => {
                        const updated = pdplAssessment.map(i => i.controlCode === code ? item : i);
                        setPdplAssessment(updated);
                        dbAPI.saveAssessmentItems(company.id, 'pdpl', updated);
                    }}
                    status={assessmentStatuses.pdpl as any || 'idle'}
                    onInitiate={() => {
                        setAssessmentStatuses(prev => ({...prev, pdpl: 'in-progress'}));
                        dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, pdpl: 'in-progress'});
                    }}
                    onComplete={() => {
                        setAssessmentStatuses(prev => ({...prev, pdpl: 'completed'}));
                        dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, pdpl: 'completed'});
                    }}
                    permissions={permissions}
                    onGenerateReport={() => {}}
                />
            )}
            {currentView === 'samaCsfAssessment' && (
                <SamaCsfAssessmentPage
                    assessmentData={samaCsfAssessment}
                    onUpdateItem={(code, item) => {
                        const updated = samaCsfAssessment.map(i => i.controlCode === code ? item : i);
                        setSamaCsfAssessment(updated);
                        dbAPI.saveAssessmentItems(company.id, 'sama', updated);
                    }}
                    status={assessmentStatuses.sama as any || 'idle'}
                    onInitiate={() => {
                        setAssessmentStatuses(prev => ({...prev, sama: 'in-progress'}));
                        dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, sama: 'in-progress'});
                    }}
                    onComplete={() => {
                        setAssessmentStatuses(prev => ({...prev, sama: 'completed'}));
                        dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, sama: 'completed'});
                    }}
                    permissions={permissions}
                    onGenerateReport={() => {}}
                />
            )}
            {currentView === 'cmaAssessment' && (
                <CMAAssessmentPage
                    assessmentData={cmaAssessment}
                    onUpdateItem={(code, item) => {
                        const updated = cmaAssessment.map(i => i.controlCode === code ? item : i);
                        setCmaAssessment(updated);
                        dbAPI.saveAssessmentItems(company.id, 'cma', updated);
                    }}
                    status={assessmentStatuses.cma as any || 'idle'}
                    onInitiate={() => {
                        setAssessmentStatuses(prev => ({...prev, cma: 'in-progress'}));
                        dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, cma: 'in-progress'});
                    }}
                    onComplete={() => {
                        setAssessmentStatuses(prev => ({...prev, cma: 'completed'}));
                        dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, cma: 'completed'});
                    }}
                    permissions={permissions}
                    onGenerateReport={() => {}}
                />
            )}
            {currentView === 'userProfile' && (
                <UserProfilePage 
                    currentUser={currentUser} 
                    onChangePassword={async (curr, newP) => { return { success: true, message: "Password updated" }; }}
                    onEnableMfa={() => setShowMfaSetup(true)}
                    onDisableMfa={async () => { return { success: true, message: "MFA Disabled" }; }}
                />
            )}
            {currentView === 'help' && <HelpSupportPage onStartTour={() => setShowTour(true)} />}
            {currentView === 'training' && (
                <TrainingPage 
                    userProgress={trainingProgress}
                    onUpdateProgress={(cId, lId, score) => {
                        const newProgress = { ...trainingProgress };
                        if (!newProgress[cId]) newProgress[cId] = { completedLessons: [], badgeEarned: false, badgeId: '' };
                        if (!newProgress[cId].completedLessons.includes(lId)) {
                            newProgress[cId].completedLessons.push(lId);
                            // Logic for badge earning...
                            dbAPI.updateTrainingProgress(company.id, newProgress);
                            setTrainingProgress(newProgress);
                        }
                    }}
                />
            )}
            {currentView === 'riskAssessment' && (
                <RiskAssessmentPage 
                    risks={risks}
                    setRisks={setRisks}
                    status={assessmentStatuses.riskAssessment as any || 'idle'}
                    onInitiate={() => {
                        const currentStatus = assessmentStatuses.riskAssessment || 'idle';
                        if (currentStatus === 'idle') {
                            setAssessmentStatuses(prev => ({...prev, riskAssessment: 'in-progress'}));
                            dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, riskAssessment: 'in-progress'});
                        } else {
                            const rashid = virtualAgents.find(a => a.id === 'agent-rashid');
                            if (rashid) {
                                setActiveVirtualAgent(rashid);
                                setShowLiveAssistant(true);
                            }
                        }
                    }}
                    onComplete={() => {
                        setAssessmentStatuses(prev => ({...prev, riskAssessment: 'idle'}));
                        dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, riskAssessment: 'idle'});
                    }}
                    permissions={permissions}
                    onGenerateReport={(filtered) => {
                        console.log("Generating report for", filtered);
                    }}
                />
            )}
            {currentView === 'complianceAgent' && (
                <ComplianceAgentPage
                    onRunAnalysis={() => []}
                    onGenerateDocuments={async (gaps) => {
                        for(const gap of gaps) {
                            // Find relevant control and generate doc
                        }
                    }}
                    agentLog={agentLog}
                    permissions={permissions}
                    assessments={{ ecc: eccAssessment, pdpl: pdplAssessment, sama: samaCsfAssessment, cma: cmaAssessment }}
                />
            )}
            {currentView === 'liveVoiceDemo' && (
                <LiveVoiceDemoPage 
                    company={company}
                    users={users}
                    documents={documents}
                    assessments={{
                        ecc: eccAssessment,
                        pdpl: pdplAssessment,
                        sama: samaCsfAssessment,
                        cma: cmaAssessment,
                        selectedFramework: Object.keys(assessmentStatuses).find(k => assessmentStatuses[k] === 'in-progress' || assessmentStatuses[k] === 'completed')
                    }}
                />
            )}
            {currentView === 'superAdmin' && <SuperAdminPage currentUser={currentUser} auditLog={auditLog} />}
            {currentView === 'integrations' && (
                <IntegrationsPage 
                    onAddRisk={(category, risk) => {
                        const newRisk = { ...risk, id: `risk-${Date.now()}` } as Risk;
                        setRisks(prev => [...prev, newRisk]);
                        dbAPI.addRisk(company.id, newRisk);
                    }}
                    addNotification={addNotification}
                    addAuditLog={handleAddAuditLog}
                />
            )}
            {currentView === 'vapt' && (
                <VaptOrchestratorPage 
                    permissions={permissions}
                    addAuditLog={handleAddAuditLog}
                    assets={assets}
                />
            )}
            {currentView === 'assets' && (
                <AssetInventoryPage
                    assets={assets}
                    onAddAsset={(a) => { setAssets(p => [...p, a]); dbAPI.addAsset(company.id, a); }}
                    onUpdateAsset={(a) => { setAssets(p => p.map(x => x.id === a.id ? a : x)); dbAPI.updateAsset(company.id, a); }}
                    onDeleteAsset={(id) => { setAssets(p => p.filter(x => x.id !== id)); dbAPI.deleteAsset(company.id, id); }}
                    onScanAsset={(a) => { setCurrentView('vapt'); }}
                    permissions={permissions}
                    addNotification={addNotification}
                    addAuditLog={handleAddAuditLog}
                />
            )}
            {currentView === 'virtualMeeting' && <MeetingRoomPage />}
            {currentView === 'whiteboard' && <MultiplayerWhiteboard />}
            {currentView === 'creatorMarketplace' && <CreatorMarketplace />}
            {currentView === 'breadcrumbDesign' && <BreadcrumbReferenceSheet />}
            {currentView === 'accordionDesign' && <AccordionShowcase />}
            {currentView === 'gemmaEngine' && <GemmaEnginePage />}
            {currentView === 'superTestAgent' && <SuperTestAgentPage />}
                    {currentView === 'virtualDepartment' && (
                        <VirtualDepartmentPage
                            onDelegateTask={(agentName, task) => {
                                const agent = ['Ahmed AI', 'Fahad AI', 'Mohammed AI', 'Ibrahim AI', 'Asaad AI', 'Abdullah AI'].find(n => n === agentName);
                                if(agent) {
                                    // Update agent status in UI (mock)
                                    addNotification(`Task delegated to ${agentName}: ${task}`, 'success');
                                }
                            }}
                            onConsultAgent={(agent) => {
                                setActiveVirtualAgent(agent);
                                setShowLiveAssistant(true);
                            }}
                            risks={risks}
                            documents={documents}
                            eccAssessment={eccAssessment}
                            pdplAssessment={pdplAssessment}
                            onAddDocument={(doc) => { setDocuments(p => [...p, doc]); dbAPI.saveDocument(company.id, doc); }}
                            onAddRisk={(risk) => { setRisks(p => [...p, risk]); dbAPI.addRisk(company.id, risk); }}
                            onAddAuditLog={handleAddAuditLog}
                            auditLog={auditLog}
                            language={language}
                        />
                    )}
                </div>
            </div>
        </div>

        {/* Global Notifications */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {notifications.map(n => (
                <div key={n.id} className={`p-4 rounded-lg shadow-lg text-white ${n.type === 'success' ? 'bg-green-600' : n.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {n.message}
                </div>
            ))}
        </div>

        {/* Live Assistant Overlay */}
        <LiveAssistantWidget 
            isOpen={showLiveAssistant}
            onToggle={() => { setShowLiveAssistant(false); setActiveVirtualAgent(null); setIsHeadlessMode(false); }}
            onNavigate={setCurrentView}
            hidden={isHeadlessMode}
            onStatusChange={setAssistantStatus}
            currentUser={currentUser}
            activeAgent={activeVirtualAgent}
            risks={risks}
            eccAssessment={eccAssessment}
            pdplAssessment={pdplAssessment}
            samaCsfAssessment={samaCsfAssessment}
            cmaAssessment={cmaAssessment}
            auditLog={auditLog}
            documents={documents}
            onAddRisk={(cat, r) => {
                const newRisk = { ...r, id: `risk-${Date.now()}` } as Risk;
                setRisks(p => [...p, newRisk]);
                dbAPI.addRisk(company!.id, newRisk);
            }}
            onGenerateReport={() => {
                addNotification("Report generated and saved to Documents.", "success");
            }}
            onInitiateAssessment={(std) => {
                const key = std === 'ecc' ? 'ecc' : std === 'pdpl' ? 'pdpl' : std === 'sama' ? 'sama' : 'cma';
                setAssessmentStatuses(p => ({...p, [key]: 'in-progress'}));
                dbAPI.updateAssessmentStatus(company!.id, {...assessmentStatuses, [key]: 'in-progress'});
            }}
            onDelegateTask={(agent, task) => {
                // Logic handled in Virtual Dept page usually, but accessible here too
                addNotification(`Task delegated to ${agent}: ${task}`, 'success');
            }}
        />

        {/* Tour Guide */}
        <TourGuide 
            isOpen={showTour} 
            onClose={() => setShowTour(false)} 
            steps={[
                { target: 'body', title: 'Welcome', content: 'Welcome to the Cybersecurity Controls Navigator. This quick tour will show you around.', position: 'center' },
                { target: '#sidebar-dashboard', title: 'Dashboard', content: 'See your compliance status at a glance.', position: 'right' },
                { target: '#sidebar-navigator-header', title: 'Controls Navigator', content: 'Browse and manage NCA ECC controls.', position: 'right' },
                // ... more steps
            ]} 
        />

        {/* Modals */}
        {showMfaSetup && <MfaSetupPage user={currentUser} companyName={company.name} onVerified={handleMfaVerify} onCancel={() => setShowMfaSetup(false)} theme={theme} toggleTheme={() => {}} />}
      </main>
    </div>
    </ErrorBoundary>
  );
}
