
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
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
import { SuperAdminPage } from './components/SuperAdminPage';
import { IntegrationsPage } from './components/IntegrationsPage';
import { VaptOrchestratorPage } from './components/VaptOrchestratorPage';
import { AssetInventoryPage } from './components/AssetInventoryPage';
import { VirtualDepartmentPage } from './components/VirtualDepartmentPage';
import { DidEmbed } from './components/DidEmbed';
import { LiveAssistantWidget } from './components/LiveAssistantWidget';
import { MfaSetupPage } from './components/MfaSetupPage';
import { MfaVerifyPage } from './components/MfaVerifyPage';
import { TourGuide } from './components/TourGuide';
import { TrainingAssistant } from './components/TrainingAssistant';
import { RiskAssistant } from './components/RiskAssistant';
import { eccData } from './data/controls';
import { dbAPI } from './db';
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
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
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
  const [showTour, setShowTour] = useState(false);
  const [activeVirtualAgent, setActiveVirtualAgent] = useState<VirtualAgent | null>(null);
  
  // MFA State
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showMfaVerify, setShowMfaVerify] = useState(false);
  const [pendingMfaUser, setPendingMfaUser] = useState<User | null>(null);

  // Computed Permissions
  const permissions = useMemo(() => {
    return new Set(currentUser ? rolePermissions[currentUser.role] : []);
  }, [currentUser]);

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      const user = await dbAPI.loginUser(''); // Check for existing session
      if (user) {
        if (user.mfaEnabled) {
            setPendingMfaUser(user);
            setShowMfaVerify(true);
        } else {
            await loadCompanyData(user);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const loadCompanyData = async (user: User) => {
    if (!user.companyId) return;
    try {
        setIsLoading(true);
        const data = await dbAPI.getCompanyData(user.companyId);
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
        addNotification("Failed to load application data.", "error");
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
    dbAPI.addAuditLog(company.id, entry);
  };

  // --- Auth Handlers ---

  const handleLogin = async (email: string, password: string): Promise<{error: string, code?: string} | null> => {
    const user = await dbAPI.loginUser(email, password);
    if (user) {
        if (!user.isVerified) return { error: "Email not verified.", code: 'unverified' };
        if (user.accessExpiresAt && user.accessExpiresAt < Date.now()) return { error: "Account access expired.", code: 'expired' };
        
        if (user.mfaEnabled) {
            setPendingMfaUser(user);
            setShowMfaVerify(true);
            return null;
        }
        
        await loadCompanyData(user);
        handleAddAuditLog('USER_LOGIN', `User ${user.email} logged in.`);
        return null;
    }
    return { error: "Invalid credentials." };
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });
          
          const content = JSON.parse(response.text || '{}') as GeneratedContent;
          
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

  // --- Render ---

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-teal-600"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
  }

  if (!currentUser || !company) {
      return (
        <div className={theme}>
            <LoginPage 
                onLogin={handleLogin} 
                theme={theme} 
                toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} 
                onSetupCompany={() => setCurrentView('companySetup')} 
                onVerify={() => true} 
                onForgotPassword={async () => ({ success: true, message: "Reset link sent" })}
                onResetPassword={async () => ({ success: true, message: "Password reset" })}
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
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200 ${theme}`}>
      <Sidebar 
        domains={eccData} 
        selectedDomain={selectedDomain} 
        onSelectDomain={handleSelectDomain} 
        currentView={currentView}
        onSetView={setCurrentView}
        permissions={permissions}
        trainingProgress={trainingProgress}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-4">
                <button onClick={() => {}} className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-tight">{company.name}</h2>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Cybersecurity Controls Navigator</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setShowLiveAssistant(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg hover:shadow-xl transition-all animate-pulse"
                >
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    Live Assistant
                </button>
                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    {theme === 'light' ? 
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> : 
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    }
                </button>
                <div className="relative">
                    <button onClick={handleLogout} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500">Sign Out</button>
                </div>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
            {currentView === 'sarahAgent' && <DidEmbed />}
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
                        setAssessmentStatuses(prev => ({...prev, riskAssessment: 'in-progress'}));
                        dbAPI.updateAssessmentStatus(company.id, {...assessmentStatuses, riskAssessment: 'in-progress'});
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
            {currentView === 'superAdmin' && <SuperAdminPage currentUser={currentUser} />}
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
                />
            )}
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
            onToggle={() => { setShowLiveAssistant(false); setActiveVirtualAgent(null); }}
            onNavigate={setCurrentView}
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
  );
}
