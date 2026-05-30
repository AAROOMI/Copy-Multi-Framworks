
import React from 'react';
import { motion } from 'motion/react';
import { DocumentIcon, UsersIcon, BuildingOfficeIcon, DashboardIcon, ClipboardListIcon, BeakerIcon, ClipboardCheckIcon, ShieldKeyholeIcon, LandmarkIcon, IdentificationIcon, QuestionMarkCircleIcon, GraduationCapIcon, ExclamationTriangleIcon, LineChartIcon, SparklesIcon, ShieldCheckIcon, ChatBotIcon, SunIcon, MoonIcon, LinkIcon, BugAntIcon, UserGroupIcon, PhoneIcon, LayoutIcon } from './Icons';
import type { Domain, Permission, View, UserTrainingProgress } from '../types';
import { virtualAgents } from '../data/virtualAgents';
import { trainingCourses } from '../data/trainingData';
const sarahJohnsonImg = "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0539526472.firebasestorage.app/o/sara.jpg?alt=media";

interface SidebarProps {
  domains: Domain[];
  selectedDomain: Domain;
  onSelectDomain: (domain: Domain) => void;
  currentView: View;
  onSetView: (view: View) => void;
  permissions: Set<Permission>;
  trainingProgress?: UserTrainingProgress;
}

export const Sidebar: React.FC<SidebarProps> = ({ domains, selectedDomain, onSelectDomain, currentView, onSetView, permissions, trainingProgress }) => {
  return (
    <aside className="w-72 glass-panel m-4 mr-0 border-white/5 shadow-2xl overflow-hidden hidden md:flex md:flex-col h-[calc(100%-2rem)]">
      <nav className="flex-grow overflow-y-auto scrollbar-hide p-4">
        <ul>
          {/* Sara - AI Agent Profile */}
          <li className="mb-6 pb-6 border-b border-white/5">
             <button
                onClick={() => onSetView('saraAgent')}
                className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full overflow-hidden ${
                    currentView === 'saraAgent'
                    ? 'bg-white/10'
                    : 'hover:bg-white/5'
                }`}
             >
                {/* Holographic Shimmer Effect for Active Profile */}
                {currentView === 'saraAgent' && (
                  <motion.div
                    className="absolute inset-0 z-0 pointer-events-none opacity-20"
                    initial={{ backgroundPosition: '0% 0%' }}
                    animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{
                      backgroundImage: 'linear-gradient(135deg, transparent 0%, #FF6B6B 20%, #FFE66D 40%, #4ECDC4 60%, #45B7D1 80%, #96E6A1 100%)',
                      backgroundSize: '200% 200%',
                      mixBlendMode: 'overlay'
                    }}
                  />
                )}

                <div className="relative mb-3 z-10">
                  {/* Circular Container with Gradient Border */}
                  <div className={`p-1 rounded-full bg-gradient-to-tr from-teal-400 to-purple-500 shadow-lg transition-transform duration-300 ${currentView === 'saraAgent' ? 'scale-105' : 'group-hover:scale-105'}`}>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 bg-gray-800">
                        {/* Sara image from Storage as requested */}
                        <img 
                            src={sarahJohnsonImg} 
                            alt="Sarah Johnson Professional Consultant" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                  </div>
                  {/* Online Status Indicator */}
                  <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-[#1A1A2E] rounded-full animate-pulse shadow-sm" title="Online"></span>
                </div>
                
                <div className="text-center z-10">
                  <span className="block font-medium text-white/90 text-[14px] leading-tight mb-1">Sarah Johnson</span>
                  <div className="flex items-center justify-center gap-1">
                      <SparklesIcon className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Virtual Consultant</span>
                  </div>
                </div>
             </button>
          </li>

          {permissions.has('dashboard:read') && (
            <li>
              <button
                  id="sidebar-dashboard"
                  onClick={() => onSetView('dashboard')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'dashboard'
                      ? 'bg-white/10 text-white font-medium border border-white/10'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <DashboardIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'dashboard' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span className="relative z-10">Dashboard</span>
                </button>
            </li>
          )}

          {/* Virtual Department Section */}
          {permissions.has('virtualDept:manage') && (
            <li className="mt-6 mb-4">
               <div className="px-3 mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Virtual GRC Dept</span>
               </div>
               <button
                  onClick={() => onSetView('virtualDepartment')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center mb-1 group relative overflow-hidden ${
                    currentView === 'virtualDepartment'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {currentView === 'virtualDepartment' && (
                    <motion.div
                      className="absolute inset-0 z-0 pointer-events-none opacity-20"
                      initial={{ backgroundPosition: '0% 0%' }}
                      animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      style={{
                        backgroundImage: 'linear-gradient(135deg, transparent 0%, #FF6B6B 20%, #FFE66D 40%, #4ECDC4 60%, #45B7D1 80%, #96E6A1 100%)',
                        backgroundSize: '200% 200%',
                        mixBlendMode: 'overlay'
                      }}
                    />
                  )}
                  <UserGroupIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'virtualDepartment' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span className="relative z-10">Department Overview</span>
                </button>
                <button
                  onClick={() => onSetView('virtualMeeting')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center mb-1 group relative overflow-hidden ${
                    currentView === 'virtualMeeting'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {currentView === 'virtualMeeting' && (
                    <motion.div
                      className="absolute inset-0 z-0 pointer-events-none opacity-20"
                      initial={{ backgroundPosition: '0% 0%' }}
                      animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      style={{
                        backgroundImage: 'linear-gradient(135deg, transparent 0%, #FF6B6B 20%, #FFE66D 40%, #4ECDC4 60%, #45B7D1 80%, #96E6A1 100%)',
                        backgroundSize: '200% 200%',
                        mixBlendMode: 'overlay'
                      }}
                    />
                  )}
                  <PhoneIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'virtualMeeting' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span className="relative z-10">Board Meeting Room</span>
                </button>
                <button
                  onClick={() => onSetView('whiteboard')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center mb-1 group relative overflow-hidden ${
                    currentView === 'whiteboard'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {currentView === 'whiteboard' && (
                    <motion.div
                      className="absolute inset-0 z-0 pointer-events-none opacity-20"
                      initial={{ backgroundPosition: '0% 0%' }}
                      animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      style={{
                        backgroundImage: 'linear-gradient(135deg, transparent 0%, #FF6B6B 20%, #FFE66D 40%, #4ECDC4 60%, #45B7D1 80%, #96E6A1 100%)',
                        backgroundSize: '200% 200%',
                        mixBlendMode: 'overlay'
                      }}
                    />
                  )}
                  <LayoutIcon className={`w-5 h-5 mr-3 transition-colors relative z-10 ${currentView === 'whiteboard' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span className="relative z-10">Collab Workspace</span>
                </button>
                <div className="pl-3 space-y-2 mt-2">
                    {virtualAgents.map(agent => (
                        <div key={agent.id} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded-md cursor-pointer transition-colors" onClick={() => onSetView('virtualDepartment')}>
                            <div className="relative">
                                <img src={agent.avatarUrl} alt={agent.name} className="w-6 h-6 rounded-full object-cover border border-white/10" />
                                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-slate-900"></span>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-slate-200">{agent.name}</p>
                                <p className="text-[9px] text-slate-500 leading-none">{agent.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </li>
          )}

           {permissions.has('users:read') && (
            <li className="mt-4">
              <button
                  onClick={() => onSetView('userManagement')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'userManagement'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <UsersIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'userManagement' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>User Management</span>
                </button>
            </li>
          )}
          {permissions.has('company:read') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('companyProfile')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'companyProfile'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <BuildingOfficeIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'companyProfile' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>Company Profile</span>
                </button>
            </li>
          )}
          {permissions.has('userProfile:read') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('userProfile')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'userProfile'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <IdentificationIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'userProfile' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>My Profile</span>
                </button>
            </li>
          )}
          {permissions.has('assets:read') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('assets')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'assets'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <ShieldCheckIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'assets' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>Asset Inventory</span>
                </button>
            </li>
          )}
          {permissions.has('integrations:manage') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('integrations')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'integrations'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <LinkIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'integrations' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>Enterprise Integrations</span>
                </button>
            </li>
          )}
          {permissions.has('vapt:manage') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('vapt')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'vapt'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <BugAntIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'vapt' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>VAPT Orchestrator</span>
                </button>
            </li>
          )}
          {permissions.has('documents:read') && (
            <li className="mt-2">
              <button
                  id="sidebar-documents"
                  onClick={() => onSetView('documents')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'documents'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <DocumentIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'documents' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>Document Management</span>
                </button>
            </li>
          )}
          
          {/* Security Awareness Section */}
          {permissions.has('training:read') && (
            <li className="mt-4 mb-2">
               <div className="px-3 mb-2 flex items-center justify-between">
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wider">Security Awareness</span>
               </div>
               <div className="space-y-1">
                   {trainingCourses.map(course => {
                       const progress = trainingProgress?.[course.id];
                       const completed = progress?.completedLessons.length || 0;
                       const total = course.lessons.length;
                       const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                       const isBadgeEarned = progress?.badgeEarned;

                       return (
                           <button
                               key={course.id}
                               onClick={() => onSetView('training')}
                               className={`w-full text-left p-2 pl-3 rounded-md text-sm transition-colors duration-200 flex items-center justify-between group ${
                                   currentView === 'training' 
                                   ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-normal' 
                                   : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                               }`}
                           >
                               <div className="flex items-center overflow-hidden gap-2">
                                   <div className={`relative flex-shrink-0 ${isBadgeEarned ? 'text-yellow-500' : 'text-gray-400'}`}>
                                      <GraduationCapIcon className="w-4 h-4" />
                                      {isBadgeEarned && <span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span>}
                                   </div>
                                   <span className="truncate text-xs">{course.title.replace('Cybersecurity ', '').replace('Security', '')}</span>
                               </div>
                               
                               <div className="flex items-center">
                                   {percent > 0 && (
                                     <div className="w-8 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 ml-2">
                                        <div className={`h-1.5 rounded-full ${percent === 100 ? 'bg-green-500' : 'bg-teal-500'}`} style={{ width: `${percent}%` }}></div>
                                     </div>
                                   )}
                               </div>
                           </button>
                       );
                   })}
               </div>
            </li>
          )}

          {permissions.has('riskAssessment:read') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('riskAssessment')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'riskAssessment'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <ExclamationTriangleIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'riskAssessment' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>Risk Assessment</span>
                </button>
            </li>
          )}
          {permissions.has('assessment:read') && (
            <li className="mt-2">
              <button
                  id="sidebar-assessment"
                  onClick={() => onSetView('assessment')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'assessment'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <ClipboardCheckIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'assessment' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>NCA ECC Assessment</span>
                </button>
            </li>
          )}
          {permissions.has('pdplAssessment:read') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('pdplAssessment')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'pdplAssessment'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <ShieldKeyholeIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'pdplAssessment' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>PDPL Assessment</span>
                </button>
            </li>
          )}
          {permissions.has('samaCsfAssessment:read') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('samaCsfAssessment')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'samaCsfAssessment'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <LandmarkIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'samaCsfAssessment' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>SAMA CSF Assessment</span>
                </button>
            </li>
          )}
          {permissions.has('cmaAssessment:read') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('cmaAssessment')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'cmaAssessment'
                      ? 'bg-white/10 text-white font-medium border border-white/10 shadow-lg shadow-cyan-500/5'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <LineChartIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'cmaAssessment' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>CMA Assessment</span>
                </button>
            </li>
          )}
          {permissions.has('audit:read') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('auditLog')}
                  className={`w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center ${
                    currentView === 'auditLog'
                      ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-normal'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <ClipboardListIcon className="w-5 h-5 mr-3" />
                  <span>Audit Log</span>
                </button>
            </li>
          )}
          {permissions.has('assessment:update') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('liveVoiceDemo')}
                  className={`w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center ${
                    currentView === 'liveVoiceDemo'
                      ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-normal'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <PhoneIcon className="w-5 h-5 mr-3 text-teal-500" />
                  <span>Live Voice Demo</span>
                </button>
            </li>
          )}
          {permissions.has('assessment:update') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('complianceAgent')}
                  className={`w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center ${
                    currentView === 'complianceAgent'
                      ? 'bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-normal'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <SparklesIcon className="w-5 h-5 mr-3" />
                  <span>Compliance Agent</span>
                </button>
            </li>
          )}
          {/* Super Admin Button */}
          {permissions.has('users:create') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('superAdmin')}
                  className={`w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center ${
                    currentView === 'superAdmin'
                      ? 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-normal'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <BuildingOfficeIcon className="w-5 h-5 mr-3 text-red-600" />
                  <span>Super Admin</span>
                </button>
            </li>
          )}
          {permissions.has('help:read') && (
            <li className="mt-2">
              <button
                  onClick={() => onSetView('help')}
                  className={`w-full text-left p-3 rounded-md text-[13px] transition-all duration-300 flex items-center group relative overflow-hidden ${
                    currentView === 'help'
                      ? 'bg-white/10 text-white font-medium border border-white/10'
                      : 'text-slate-400 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <QuestionMarkCircleIcon className={`w-5 h-5 mr-3 transition-colors ${currentView === 'help' ? 'text-cyan-400' : 'group-hover:text-cyan-400/70'}`} />
                  <span>System Support</span>
                </button>
            </li>
          )}
        </ul>
      </nav>


      {/* Internal Links for Quick Access */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-normal text-gray-500 dark:text-gray-400 mb-2 px-2 uppercase tracking-wider">Quick Links</h2>
           <button
              onClick={() => onSetView('cmaAssessment')}
              className="w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-gray-200 dark:bg-gray-600 text-xs font-normal text-gray-600 dark:text-gray-200 flex-shrink-0">1</span>
              <span>CMA</span>
            </button>
            <button
              onClick={() => onSetView('breadcrumbDesign')}
              className="w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs font-normal text-blue-600 dark:text-blue-400 flex-shrink-0">BD</span>
              <span>Breadcrumb Design</span>
            </button>
            <button
              onClick={() => onSetView('accordionDesign')}
              className="w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-xs font-normal text-purple-600 dark:text-purple-400 flex-shrink-0">AD</span>
              <span>Accordion Design</span>
            </button>
            <a
              href="https://hrsd-automated-policy-generator-365172165068.us-west1.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-gray-200 dark:bg-gray-600 text-xs font-normal text-gray-600 dark:text-gray-200 flex-shrink-0">2</span>
              <span>HRSD</span>
            </a>
           <button
              onClick={() => onSetView('pdplAssessment')}
              className="w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-gray-200 dark:bg-gray-600 text-xs font-normal text-gray-600 dark:text-gray-200 flex-shrink-0">3</span>
              <span>PDPL</span>
            </button>
            <a
              href="https://app-496821664990.us-west1.run.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 rounded-full bg-gray-200 dark:bg-gray-600 text-xs font-normal text-gray-600 dark:text-gray-200 flex-shrink-0">4</span>
              <span>ISO 31000</span>
            </a>
      </div>

      {permissions.has('navigator:read') && (
        <div id="sidebar-navigator-header" className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4 px-2">
            <h2 className="text-lg font-normal text-gray-700 dark:text-gray-200">NCA ECC Control Navigator</h2>
          </div>
          <nav>
            <ul>
              {domains.map((domain, index) => {
                const controlCount = domain.subdomains.reduce((acc, sub) => acc + sub.controls.length, 0);
                const isSelected = selectedDomain.id === domain.id && currentView === 'navigator';
                return (
                  <li key={domain.id} className="mb-2">
                    <button
                      onClick={() => onSelectDomain(domain)}
                      className={`w-full text-left p-3 rounded-md text-sm transition-colors duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-normal'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <div className="flex items-start flex-1 min-w-0">
                        <span className={`mr-3 font-mono text-teal-600 dark:text-teal-400 ${isSelected ? 'font-normal' : ''}`}>{index + 1}</span>
                        <span className="truncate" title={domain.name}>{domain.name}</span>
                      </div>
                      <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full whitespace-nowrap ${
                        isSelected
                          ? 'bg-teal-200 dark:bg-teal-500/50 text-teal-800 dark:text-teal-200'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                      }`}>
                        {controlCount} {controlCount === 1 ? 'Control' : 'Controls'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </aside>
  );
};
