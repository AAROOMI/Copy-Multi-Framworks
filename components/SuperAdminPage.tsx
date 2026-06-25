import React, { useState, useEffect } from 'react';
import { dbAPI } from '../db';
import type { CompanyProfile, User, License, AuditLogEntry } from '../types';
import { SystemHealthCard } from './SystemHealthCard';
import { AdminActivityLog } from './AdminActivityLog';
import { ControlPlaneModules } from './ControlPlaneModules';
import { ControlPlaneToggles } from './ControlPlaneToggles';
import { ControlPlaneBuilders } from './ControlPlaneBuilders';
import { 
    Building, 
    Key, 
    Users, 
    Calendar, 
    AlertCircle, 
    RefreshCw, 
    BarChart2, 
    Trash2, 
    Check, 
    Plus, 
    Shield, 
    ShieldCheck, 
    Search, 
    Mail, 
    Lock, 
    CheckSquare, 
    UserPlus, 
    Sliders,
    Zap
} from 'lucide-react';

interface SuperAdminPageProps {
    currentUser: User;
    auditLog: AuditLogEntry[];
}

type AdminTab = 'provisioning' | 'licenses' | 'users' | 'companies' | 'subscriptions' | 'modules' | 'toggles' | 'builders' | 'auditLog';

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ currentUser, auditLog }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('subscriptions');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const addControlPlaneAuditLog = async (action: string, details: string) => {
        const entry: AuditLogEntry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: currentUser.id,
            userName: currentUser.name,
            action: action as any,
            details: details,
            timestamp: Date.now()
        };
        if (currentUser.companyId) {
            try {
                await dbAPI.addAuditLog(currentUser.companyId, entry);
            } catch (e) {
                console.warn("Failed to write audit log to DB (demo or offline fallback):", e);
            }
        }
    };

    // Master Data States
    const [allCompanies, setAllCompanies] = useState<CompanyProfile[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [standaloneLicenses, setStandaloneLicenses] = useState<License[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Provisioning State
    const [companyName, setCompanyName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [subscriptionTier, setSubscriptionTier] = useState<License['tier']>('yearly');

    // Standalone Generator State
    const [generatedKey, setGeneratedKey] = useState('');
    const [generatorTier, setGeneratorTier] = useState<License['tier']>('yearly');

    // Auth & User Editors State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [targetUser, setTargetUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CISO' as User['role'],
        companyId: '',
        isVerified: true,
        mfaEnabled: false,
    });

    // License Assignment State
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [selectedLicenseKey, setSelectedLicenseKey] = useState('');

    // Renewal Direct Adjustment State
    const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
    const [renewCompany, setRenewCompany] = useState<CompanyProfile | null>(null);
    const [renewMonths, setRenewMonths] = useState(12);
    const [renewTier, setRenewTier] = useState<License['tier']>('yearly');

    useEffect(() => {
        loadAllData();
    }, [activeTab]);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const [companies, users, standalones] = await Promise.all([
                dbAPI.getAllCompanies(),
                dbAPI.getAllUsers(),
                dbAPI.getStandaloneLicenses()
            ]);
            setAllCompanies(companies);
            setAllUsers(users);
            setStandaloneLicenses(standalones || []);
        } catch (e) {
            console.error("Super Admin background restore error: ", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProvisioningSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const expiresAt = calculateExpiration(subscriptionTier);

        const licenseData: License = {
            key: `LIC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            status: 'active',
            tier: subscriptionTier,
            expiresAt: expiresAt
        };

        const companyData = {
            name: companyName,
            logo: '', ceoName: '', cioName: '', cisoName: '', ctoName: '',
        };

        const adminData = {
            name: adminName,
            email: adminEmail,
            password: adminPassword
        };

        try {
            await dbAPI.createCompanySystem(companyData, adminData, licenseData);
            setMessage({ text: `Successfully created company "${companyName}" and administrator account "${adminEmail}".`, type: 'success' });
            setCompanyName(''); 
            setAdminName(''); 
            setAdminEmail(''); 
            setAdminPassword('');
            loadAllData();
        } catch (error: any) {
            setMessage({ text: error.message || "Failed to provision workspace system.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const generateKeyHandler = async () => {
        const key = `SA-KEY-${Math.random().toString(36).substring(2, 14).toUpperCase()}`;
        setGeneratedKey(key);

        const newLicense: License = {
            key: key,
            tier: generatorTier,
            status: 'active',
            expiresAt: calculateExpiration(generatorTier)
        };

        const currentStandalones = [...standaloneLicenses, newLicense];
        setStandaloneLicenses(currentStandalones);
        await dbAPI.saveStandaloneLicenses(currentStandalones);
        setMessage({ text: `STANDALONE LICENCE KEY "${key}" SUCCESSFULLY PERSISTED TO SECURE REGISTRY.`, type: 'success' });
    };

    const deleteStandaloneLicense = async (key: string) => {
        if (!confirm("Are you sure you want to delete this standalone license key?")) return;
        const filtered = standaloneLicenses.filter(l => l.key !== key);
        setStandaloneLicenses(filtered);
        await dbAPI.saveStandaloneLicenses(filtered);
        setMessage({ text: `License key registry successfully updated.`, type: 'success' });
    };

    const assignLicenseToCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompanyId || !selectedLicenseKey) {
            setMessage({ text: "Please select both target company and Standalone code.", type: 'error' });
            return;
        }

        const comp = allCompanies.find(c => c.id === selectedCompanyId);
        const lic = standaloneLicenses.find(l => l.key === selectedLicenseKey);

        if (!comp || !lic) {
            setMessage({ text: "Selection mismatch. Please verify profiles.", type: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            // Update company with our registry code
            const updatedLicense: License = { ...lic };
            await dbAPI.updateLicense(selectedCompanyId, updatedLicense);

            // Strip the code from standalone directory
            const filteredLicenses = standaloneLicenses.filter(l => l.key !== selectedLicenseKey);
            setStandaloneLicenses(filteredLicenses);
            await dbAPI.saveStandaloneLicenses(filteredLicenses);

            setMessage({ text: `Standalone License safely associated to company "${comp.name}".`, type: 'success' });
            setSelectedCompanyId('');
            setSelectedLicenseKey('');
            loadAllData();
        } catch (error: any) {
            setMessage({ text: error.message || "Failed to link subscription key.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const calculateExpiration = (tier: License['tier'], customMonths?: number): number => {
        const now = new Date();
        if (customMonths) {
            return new Date(now.setMonth(now.getMonth() + customMonths)).getTime();
        }
        let months = 12;
        if (tier === 'monthly') months = 1;
        if (tier === 'quarterly') months = 3;
        if (tier === 'semi-annually') months = 6;
        if (tier === 'trial') months = 0.25;
        return new Date(now.setMonth(now.getMonth() + months)).getTime();
    };

    // User Auth Actions
    const handleOpenUserModal = (user: User | null) => {
        if (user) {
            setTargetUser(user);
            setUserForm({
                name: user.name,
                email: user.email,
                password: '', // blank by default unless super admin resets
                role: user.role,
                companyId: user.companyId || '',
                isVerified: user.isVerified ?? true,
                mfaEnabled: user.mfaEnabled ?? false,
            });
        } else {
            setTargetUser(null);
            setUserForm({
                name: '',
                email: '',
                password: '',
                role: 'CISO',
                companyId: allCompanies[0]?.id || '',
                isVerified: true,
                mfaEnabled: false,
            });
        }
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            if (targetUser) {
                // Update Existing User & Auth settings
                const updatedUser: User = {
                    ...targetUser,
                    name: userForm.name,
                    email: userForm.email,
                    role: userForm.role,
                    companyId: userForm.companyId || undefined,
                    isVerified: userForm.isVerified,
                    mfaEnabled: userForm.mfaEnabled,
                };
                if (userForm.password.trim().length >= 6) {
                    updatedUser.password = userForm.password;
                }
                await dbAPI.updateUser(updatedUser);
                setMessage({ text: `User profile "${userForm.email}" updated successfully.`, type: 'success' });
            } else {
                // Register Brand New User
                const newUser: User = {
                    id: `user-${Date.now()}`,
                    name: userForm.name,
                    email: userForm.email,
                    role: userForm.role,
                    companyId: userForm.companyId || undefined,
                    isVerified: userForm.isVerified,
                    mfaEnabled: userForm.mfaEnabled,
                    password: userForm.password || 'temp-pass-123'
                };
                await dbAPI.createUser(newUser, userForm.companyId);
                setMessage({ text: `New user "${userForm.email}" successfully provisioned and linked.`, type: 'success' });
            }
            setIsUserModalOpen(false);
            loadAllData();
        } catch (error: any) {
            setMessage({ text: error.message || "Could not commit user master record.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserVerification = async (user: User) => {
        setIsLoading(true);
        try {
            const updated = { ...user, isVerified: !user.isVerified };
            await dbAPI.updateUser(updated);
            setMessage({ text: `Auth status updated: verified=${updated.isVerified}`, type: 'success' });
            loadAllData();
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to toggle email verification state.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserMfa = async (user: User) => {
        setIsLoading(true);
        try {
            const updated = { ...user, mfaEnabled: !user.mfaEnabled };
            await dbAPI.updateUser(updated);
            setMessage({ text: `MFA bypass state updated: mfaEnabled=${updated.mfaEnabled}`, type: 'success' });
            loadAllData();
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to toggle MFA status.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteUserRecord = async (user: User) => {
        if (!confirm(`Are you absolutely sure you want to delete user ${user.name} (${user.email})?`)) return;
        setIsLoading(true);
        try {
            await dbAPI.deleteUser(user.id);
            setMessage({ text: `Successfully terminated user credentials record.`, type: 'success' });
            loadAllData();
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to delete user.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const sendResetLink = async (email: string) => {
        try {
            await dbAPI.sendPasswordResetLink(email);
            setMessage({ text: `Password recovery reset request issued to "${email}".`, type: 'success' });
        } catch (e: any) {
            setMessage({ text: e.message || "Could not dispatch reset email link.", type: 'error' });
        }
    };

    // Renew Co Subscription
    const handleOpenRenewal = (company: CompanyProfile) => {
        setRenewCompany(company);
        setRenewTier(company.license?.tier || 'yearly');
        setRenewMonths(12);
        setIsRenewalModalOpen(true);
    };

    const handleExecuteRenewal = async () => {
        if (!renewCompany) return;
        setIsLoading(true);
        try {
            const currentLicense = renewCompany.license;
            const newExpiry = calculateExpiration(renewTier, renewMonths);
            
            const updatedLicense: License = {
                key: currentLicense?.key || `LIC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                status: 'active',
                tier: renewTier,
                expiresAt: newExpiry
            };

            await dbAPI.updateLicense(renewCompany.id, updatedLicense);
            setMessage({ text: `Renewed subscription for "${renewCompany.name}". New Expiry: ${new Date(newExpiry).toLocaleDateString()}`, type: 'success' });
            setIsRenewalModalOpen(false);
            loadAllData();
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to renew company subscription.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivateSubscription = async (company: CompanyProfile) => {
        if (!confirm(`Are you sure you want to deactivate and hold client organization "${company.name}"?`)) return;
        setIsLoading(true);
        try {
            const currentLicense = company.license;
            const updatedLicense: License = {
                key: currentLicense?.key || 'EXPIRED-LIC',
                status: 'expired',
                tier: currentLicense?.tier || 'trial',
                expiresAt: Date.now() // expires instantly
            };
            await dbAPI.updateLicense(company.id, updatedLicense);
            setMessage({ text: `Subscription on hold for "${company.name}".`, type: 'success' });
            loadAllData();
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to deactivate subscription.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    // Expiry Metrics Calculations for dashboard
    const nowTimestamp = Date.now();
    const activeSubscriptionCount = allCompanies.filter(c => c.license?.status === 'active' && c.license.expiresAt > nowTimestamp).length;
    const soonExpiringCount = allCompanies.filter(c => {
        if (!c.license || c.license.status !== 'active') return false;
        const diffMs = c.license.expiresAt - nowTimestamp;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays <= 30;
    }).length;
    const expiredCount = allCompanies.filter(c => !c.license || c.license.status === 'expired' || c.license.expiresAt <= nowTimestamp).length;

    // Filters
    const filteredUsers = allUsers.filter(u => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCompanies = allCompanies.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
            {/* Super Admin Title - strictly normal typography */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <div>
                    <h1 className="text-lg font-normal text-gray-800 dark:text-gray-100 tracking-tight">System Admin Console</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-1 uppercase tracking-wider">Multi-Tenant infrastructure controls & telemetry</p>
                </div>
                <div className="flex flex-wrap bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 rounded-lg gap-1">
                    <button onClick={() => setActiveTab('subscriptions')} className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${activeTab === 'subscriptions' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>Subscriptions Monitor</button>
                    <button onClick={() => setActiveTab('users')} className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${activeTab === 'users' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>User Auth</button>
                    <button onClick={() => setActiveTab('modules')} className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${activeTab === 'modules' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>Modules & Frameworks</button>
                    <button onClick={() => setActiveTab('toggles')} className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${activeTab === 'toggles' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>Toggle Matrix & Killswitches</button>
                    <button onClick={() => setActiveTab('builders')} className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${activeTab === 'builders' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>Builders & Billing</button>
                    <button onClick={() => setActiveTab('licenses')} className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${activeTab === 'licenses' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>Standalone Licenses</button>
                    <button onClick={() => setActiveTab('provisioning')} className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${activeTab === 'provisioning' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>Provision Corporate</button>
                    <button onClick={() => setActiveTab('companies')} className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${activeTab === 'companies' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>Client Nodes</button>
                    <button onClick={() => setActiveTab('auditLog')} className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${activeTab === 'auditLog' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>Admin activity</button>
                </div>
            </div>

            {/* Notification Bar */}
            {message && (
                <div className={`p-4 rounded-lg flex items-start gap-3 transition-opacity ${message.type === 'success' ? 'bg-emerald-50/75 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50' : 'bg-rose-50/75 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900/50'}`}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="text-xs font-normal uppercase tracking-wider block mb-1">{message.type === 'success' ? 'ADMIN TRANSACTION OK' : 'ADMIN TRANSACTION FAILED'}</span>
                        <span className="text-sm font-normal">{message.text}</span>
                    </div>
                </div>
            )}

            {/* 1. SUBSCRIPTIONS MONITOR TAB */}
            {activeTab === 'subscriptions' && (
                <div className="space-y-6">
                    {/* Metrics Layout: D3 SystemHealthCard and 4 metrics cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3">
                            <SystemHealthCard companies={allCompanies} users={allUsers} />
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 p-4 rounded-xl flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-normal">Registered Workspaces</span>
                                    <span className="text-xl font-normal text-gray-800 dark:text-gray-100 mt-1 block font-mono">{allCompanies.length}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 block font-normal">Multi-tenant client nodes</span>
                            </div>
                            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] text-emerald-500 uppercase tracking-widest block font-normal">Active Contracts</span>
                                    <span className="text-xl font-normal text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">{activeSubscriptionCount}</span>
                                </div>
                                <span className="text-[10px] text-emerald-600/80 mt-1 block font-normal">Active database pipelines</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 p-4 rounded-xl flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] text-amber-500 uppercase tracking-widest block font-normal">Expiring (&lt;30 Days)</span>
                                    <span className="text-xl font-normal text-amber-600 dark:text-amber-400 mt-1 block font-mono">{soonExpiringCount}</span>
                                </div>
                                <span className="text-[10px] text-amber-600/85 mt-1 block font-normal">Awaiting administrative renewal</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 p-4 rounded-xl flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] text-rose-500 uppercase tracking-widest block font-normal">Deactivated / Expired</span>
                                    <span className="text-xl font-normal text-rose-600 dark:text-rose-400 mt-1 block font-mono">{expiredCount}</span>
                                </div>
                                <span className="text-[10px] text-rose-600/80 mt-1 block font-normal">Restricted access workspaces</span>
                            </div>
                        </div>
                    </div>

                    {/* Active Subscriptions Timeline List */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-normal text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-teal-600" />
                                    Workspace Subscription Lifecycle Registry
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 font-normal">Monitor contract age, plan tier status, and perform administrative overrides</p>
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search workspace..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-xs w-full sm:w-60 outline-none focus:border-teal-500" 
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Tenant Organization</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Assigned License Code</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Subscription Tier</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Time Left & Progress Meter</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Expiration Date</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/55">
                                    {filteredCompanies.map(comp => {
                                        const lic = comp.license;
                                        const isExpired = !lic || lic.status === 'expired' || lic.expiresAt <= nowTimestamp;
                                        
                                        // Calculate elapsed relative length
                                        let daysRemaining = 0;
                                        let progressPercentage = 0;
                                        if (lic && lic.expiresAt > nowTimestamp) {
                                            const totalDurationMs = calculateExpiration(lic.tier) - nowTimestamp;
                                            const remainingMs = lic.expiresAt - nowTimestamp;
                                            daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
                                            progressPercentage = Math.max(5, Math.min(100, Math.ceil((remainingMs / (remainingMs + 30000000000)) * 100)));
                                        }

                                        return (
                                            <tr key={comp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-normal text-gray-900 dark:text-gray-100 block">{comp.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-normal uppercase mt-0.5 block">ID: {comp.id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs text-gray-600 dark:text-gray-300 block">{lic?.key || 'UNASSIGNED'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-normal uppercase ${isExpired ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50'}`}>
                                                        {lic?.tier || 'No Active Plan'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isExpired ? (
                                                        <span className="text-xs text-rose-500 font-normal">Contract Expired</span>
                                                    ) : (
                                                        <div className="flex flex-col gap-1.5 w-44">
                                                            <div className="flex items-center justify-between text-[10px] font-normal text-gray-400">
                                                                <span>{daysRemaining} Days remaining</span>
                                                                <span>{progressPercentage}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${daysRemaining <= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                                    style={{ width: `${progressPercentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                    {lic ? new Date(lic.expiresAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button 
                                                        onClick={() => handleOpenRenewal(comp)} 
                                                        className="px-2.5 py-1 text-[11px] font-normal bg-gray-50 hover:bg-teal-550 hover:text-teal-600 dark:bg-gray-900 dark:hover:bg-teal-950/20 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-800 uppercase tracking-wider transition-all"
                                                    >
                                                        Renew / Adjust
                                                    </button>
                                                    {!isExpired && (
                                                        <button 
                                                            onClick={() => handleDeactivateSubscription(comp)} 
                                                            className="px-2.5 py-1 text-[11px] font-normal hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/25 text-gray-400 rounded uppercase tracking-wider transition-all"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredCompanies.length === 0 && (
                                <div className="p-8 text-center text-gray-400 text-xs uppercase tracking-widest font-normal">
                                    No tenant corporate data matches selection
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. USER AUTH TAB (GLOBAL USERS AUTH MANAGEMENT) */}
            {activeTab === 'users' && (
                <div className="space-y-6">
                    {/* Controls row */}
                    <div className="bg-white dark:bg-gray-800 p-5 border border-gray-200 dark:border-gray-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-normal text-teal-600 uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Global Identity & Auth Management
                            </h2>
                            <p className="text-xs text-gray-500 font-normal mt-1">Super Admin global RBAC permissions configuration dashboard. Trigger password resets and toggle bypass controls instantly</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search email, name or role..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-xs w-full sm:w-56 outline-none focus:border-teal-500" 
                                />
                            </div>
                            <button 
                                onClick={() => handleOpenUserModal(null)} 
                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded text-xs font-normal uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-teal-500/10"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add User
                            </button>
                        </div>
                    </div>

                    {/* Master User Table */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">User Identity</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Corporate Email</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Linked Organization</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">RBAC Role</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-center">Verified State</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-center">MFA Status</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-right">Auth Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredUsers.map(user => {
                                        const company = allCompanies.find(c => c.id === user.companyId);
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all font-normal">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-normal text-gray-900 dark:text-gray-100 block">{user.name}</span>
                                                    <span className="text-[9px] text-gray-400 font-normal uppercase tracking-widest font-mono mt-0.5 block">ID: {user.id}</span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-350">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-700 dark:text-gray-300 block">{company ? company.name : 'Stand-alone GRC User'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-normal uppercase ${user.role === 'Super Admin' || user.role === 'internal_admin' ? 'bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => toggleUserVerification(user)}
                                                        title="Click to toggle email verification state directly in database authentication"
                                                        className={`px-2.5 py-0.5 rounded text-[10px] font-normal uppercase transition-all ${user.isVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' : 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'}`}
                                                    >
                                                        {user.isVerified ? 'Verified' : 'Pending'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => toggleUserMfa(user)}
                                                        title="Toggle force multi-factor authentication registration check"
                                                        className={`px-2.5 py-0.5 rounded text-[10px] font-normal uppercase transition-all ${user.mfaEnabled ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400'}`}
                                                    >
                                                        {user.mfaEnabled ? 'Enabled' : 'Bypassed'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button 
                                                        onClick={() => handleOpenUserModal(user)} 
                                                        className="px-2 py-0.5 text-xs text-teal-600 dark:text-teal-400 hover:underline uppercase font-normal tracking-wider"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => sendResetLink(user.email)} 
                                                        className="px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400 hover:underline uppercase font-normal tracking-wider"
                                                        title="Triggers real Firebase authentication reset pipeline"
                                                    >
                                                        Reset Link
                                                    </button>
                                                    {user.email !== currentUser.email && (
                                                        <button 
                                                            onClick={() => deleteUserRecord(user)} 
                                                            className="px-2 py-0.5 text-xs text-rose-500 hover:underline uppercase font-normal tracking-wider"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <div className="p-8 text-center text-gray-400 text-xs uppercase tracking-widest font-normal">
                                    No users found matching search query
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. STANDALONE LICENSES TAB */}
            {activeTab === 'licenses' && (
                <div className="space-y-6">
                    {/* STANDALONE LICENSE CREATION CARDS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Standalone Key Code Generator */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                            <div>
                                <h2 className="text-sm font-normal text-teal-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <Key className="w-5 h-5 text-teal-600" />
                                    Standalone License Key Provisioning
                                </h2>
                                <p className="text-xs text-gray-500 font-normal mb-5 leading-relaxed">
                                    Generate standalone corporate cryptographic keys and store them in the global registry directory. These generated keys can be sent to clients or linked to active organizations below.
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-2">License Subscription Tier</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['trial', 'monthly', 'quarterly', 'semi-annually', 'yearly'] as const).map(tier => (
                                                <button 
                                                    key={tier} 
                                                    type="button" 
                                                    onClick={() => setGeneratorTier(tier)}
                                                    className={`py-2 px-3 border rounded-lg text-center text-xs uppercase tracking-normal transition-all font-normal ${generatorTier === tier ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'}`}
                                                >
                                                    {tier}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {generatedKey && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] text-gray-400 block uppercase tracking-wider">GENERATED SYSTEM ACCESS KEY</span>
                                                <span className="font-mono text-sm tracking-widest text-teal-600 mt-1 block select-all">{generatedKey}</span>
                                            </div>
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(generatedKey); alert("Copied code to clipboard!"); }}
                                                className="text-teal-600 text-[10px] uppercase tracking-wider hover:underline font-normal"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-6 text-right">
                                <button 
                                    onClick={generateKeyHandler}
                                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded text-xs uppercase tracking-wider transition-all font-normal inline-flex items-center gap-2 shadow shadow-teal-500/10"
                                >
                                    <Zap className="w-4 h-4" />
                                    Generate & Save Key
                                </button>
                            </div>
                        </div>

                        {/* License to Company Connector */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                            <form onSubmit={assignLicenseToCompany} className="h-full flex flex-col justify-between">
                                <div>
                                    <h2 className="text-sm font-normal text-teal-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Sliders className="w-5 h-5 text-teal-600" />
                                        Associate Code to Existing Tenant Node
                                    </h2>
                                    <p className="text-xs text-gray-500 font-normal mb-5 leading-relaxed">
                                        Map any unused generated standalone key from your secure registry registry directly onto an existing client organization, overwriting their previous configuration.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Select Client Workspace</label>
                                            <select 
                                                value={selectedCompanyId} 
                                                onChange={e => setSelectedCompanyId(e.target.value)}
                                                required 
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-2.5 px-3 text-sm outline-none"
                                            >
                                                <option value="">-- Choose Corporate Account --</option>
                                                {allCompanies.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} (Current Tier: {c.license?.tier || 'None'})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Select Unassigned Standalone Key</label>
                                            <select 
                                                value={selectedLicenseKey} 
                                                onChange={e => setSelectedLicenseKey(e.target.value)}
                                                required 
                                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-2.5 px-3 text-sm outline-none"
                                            >
                                                <option value="">-- Choose Key Registry --</option>
                                                {standaloneLicenses.length === 0 ? (
                                                    <option disabled>No Standalone Keys currently generated first</option>
                                                ) : (
                                                    standaloneLicenses.map(l => (
                                                        <option key={l.key} value={l.key}>{l.key} ({l.tier} - Expires {new Date(l.expiresAt).toLocaleDateString()})</option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-6 text-right">
                                    <button 
                                        type="submit"
                                        disabled={isLoading || standaloneLicenses.length === 0}
                                        className="bg-gray-900 dark:bg-teal-650 hover:bg-teal-700 text-white px-6 py-2 rounded text-xs uppercase tracking-wider transition-all font-normal inline-flex items-center gap-1.5 shadow"
                                    >
                                        Link Subscription License
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Standalone registries database view */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                             <h2 className="text-sm font-normal text-gray-800 dark:text-gray-100 uppercase tracking-widest">Standalone Key Active Registries</h2>
                             <p className="text-xs text-gray-500 mt-1 font-normal">Historically generated standalone licence codes currently awaiting client activation</p>
                        </div>
                        <div className="overflow-x-auto font-mono">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Registries Key Code</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Designated Contract Tier</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Validity Period</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider">Status Code</th>
                                        <th className="px-6 py-4 text-xs font-normal text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {standaloneLicenses.map(lic => (
                                        <tr key={lic.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-all font-normal">
                                            <td className="px-6 py-4 text-xs select-all">{lic.key}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded text-[10px] uppercase font-sans font-normal">
                                                    {lic.tier}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                                {new Date(lic.expiresAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded text-[10px] uppercase font-sans font-normal">
                                                    {lic.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => deleteStandaloneLicense(lic.key)} 
                                                    className="px-2 py-0.5 hover:bg-rose-50 text-rose-500 rounded text-xs uppercase font-normal tracking-wider transition-all"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {standaloneLicenses.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400 text-xs uppercase tracking-widest font-normal">No Standalone Keys persistent in Firebase database yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. PROVISIONING TAB (KEEP ORIGINAL LOGIC POLISHED) */}
            {activeTab === 'provisioning' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <h2 className="text-sm font-normal text-teal-600 dark:text-teal-400 flex items-center uppercase tracking-widest">
                            <Building className="w-5 h-5 mr-3 text-teal-600" />
                            Client Workspace Pipeline Provisioner
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 font-normal">Instigate secure tenant organization database registers and establish initial CISO administration credentials.</p>
                    </div>
                    <form onSubmit={handleProvisioningSubmit} className="p-6 sm:p-8 space-y-10">
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Company Identity</h3>
                                <p className="text-xs text-xs text-gray-400 mt-1 uppercase tracking-wider font-normal">Organization master record registry setup.</p>
                            </div>
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1.5">Organization Corporate Name</label>
                                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-teal-500 outline-none" placeholder="e.g. Al-Rajhi GRC Solutions" />
                            </div>
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-gray-150 dark:border-gray-800/80 pt-10">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Master Administrative Account</h3>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-normal">Initial CISO organization administration profile configuration.</p>
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1.5">Administrator Full Name</label>
                                    <input type="text" required value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-3 px-4 text-sm outline-none focus:border-teal-400" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1.5">Corporate Email Address</label>
                                    <input type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-3 px-4 text-sm outline-none focus:border-teal-400" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1.5">Secure Initial Password</label>
                                    <input type="password" required minLength={8} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-3 px-4 text-sm outline-none font-mono" placeholder="Minimal 8 characters" />
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-gray-150 dark:border-gray-800/80 pt-10">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Plan License Allocation</h3>
                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-normal">Designate contract parameters.</p>
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {(['trial', 'monthly', 'quarterly', 'semi-annually', 'yearly'] as const).map(tier => (
                                    <button key={tier} type="button" onClick={() => setSubscriptionTier(tier)} className={`py-4 px-3 border rounded-xl flex flex-col items-center justify-center transition-all ${subscriptionTier === tier ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:border-teal-300'}`}>
                                        <span className="text-[10px] font-normal uppercase tracking-widest">{tier}</span>
                                        <span className="text-[9px] text-gray-400 mt-1">{tier === 'trial' ? '7 Days' : tier === 'monthly' ? '30 Days' : '365 Days'}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <div className="pt-8 border-t border-gray-150 dark:border-gray-800 flex justify-end">
                            <button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg text-xs font-normal uppercase tracking-wider shadow-lg transition-all disabled:opacity-50">
                                {isLoading ? 'Configuring Security Infrastructure...' : 'Provision Client System'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 5. COMPANIES TAB */}
            {activeTab === 'companies' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCompanies.map(comp => {
                        const isExpired = !comp.license || comp.license.status === 'expired' || comp.license.expiresAt <= nowTimestamp;
                        return (
                            <div key={comp.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-800">
                                            <Building className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-normal border ${isExpired ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                            {isExpired ? 'expired' : comp.license?.status}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">{comp.name}</h3>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-normal">ID: {comp.id}</p>
                                    
                                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                                        <div className="flex justify-between items-center uppercase tracking-normal">
                                            <span className="text-gray-400 text-[10px]">Subscription Plan</span>
                                            <span className="text-teal-600 dark:text-teal-400 font-normal">{comp.license?.tier || 'No plan'}</span>
                                        </div>
                                        <div className="flex justify-between items-center uppercase tracking-normal">
                                            <span className="text-gray-400 text-[10px]">Registry Key</span>
                                            <span className="text-gray-600 dark:text-gray-300 font-mono text-[11px]">{comp.license?.key || 'None'}</span>
                                        </div>
                                        <div className="flex justify-between items-center uppercase tracking-normal">
                                            <span className="text-gray-400 text-[10px]">License Expiry</span>
                                            <span className="text-gray-600 dark:text-gray-300 font-mono text-[11px]">{comp.license ? new Date(comp.license.expiresAt).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <button 
                                        onClick={() => handleOpenRenewal(comp)} 
                                        className="w-full bg-gray-50 dark:bg-gray-900 hover:bg-teal-50 dark:hover:bg-teal-90/20 text-gray-600 dark:text-gray-400 hover:text-teal-650 py-2 rounded text-[10px] uppercase tracking-widest border border-gray-250 dark:border-gray-800 transition-all font-normal"
                                    >
                                        Edit Subscription Info
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={() => setActiveTab('provisioning')} className="border-2 border-dashed border-gray-250 dark:border-gray-800 hover:border-teal-500/50 rounded-xl p-12 text-center transition-all group flex flex-col items-center justify-center">
                        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4 transition-all group-hover:bg-teal-500/10">
                            <Plus className="w-5 h-5 text-gray-400 group-hover:text-teal-500" />
                        </div>
                        <span className="text-xs font-normal text-gray-400 uppercase tracking-widest">Register Workspace Node</span>
                    </button>
                </div>
            )}

            {/* MODULES & FRAMEWORKS REGISTRY */}
            {activeTab === 'modules' && (
                <ControlPlaneModules addAuditLog={addControlPlaneAuditLog} />
            )}

            {/* UNIVERSAL TOGGLES MATRIX */}
            {activeTab === 'toggles' && (
                <ControlPlaneToggles addAuditLog={addControlPlaneAuditLog} />
            )}

            {/* PROCESS BUILDERS & BILLING */}
            {activeTab === 'builders' && (
                <ControlPlaneBuilders addAuditLog={addControlPlaneAuditLog} />
            )}

            {/* 6. AUDIT LOG TAB */}
            {activeTab === 'auditLog' && (
                <div className="space-y-6">
                    <AdminActivityLog auditLog={auditLog} users={allUsers} />
                </div>
            )}

            {/* 7. MODAL: RENEWAL & MANUAL LICENSE ADJUSTMENT */}
            {isRenewalModalOpen && renewCompany && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 space-y-4">
                        <div className="border-b border-gray-150 dark:border-gray-700 pb-3">
                            <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Renew Subscription Plan</h3>
                            <p className="text-xs text-gray-500 mt-1 font-normal">Client: {renewCompany.name}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Set Subscription Contract Tier</label>
                                <select 
                                    value={renewTier} 
                                    onChange={e => setRenewTier(e.target.value as License['tier'])}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none"
                                >
                                    <option value="trial">Trial Access</option>
                                    <option value="monthly">Monthly Contract</option>
                                    <option value="quarterly">Quarterly Plan</option>
                                    <option value="semi-annually">Semi-Annually Plan</option>
                                    <option value="yearly">Yearly Corporate Plan</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1.5">Extend Duration (Months)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 3, 6, 12].map(m => (
                                        <button 
                                            key={m} 
                                            type="button" 
                                            onClick={() => setRenewMonths(m)}
                                            className={`py-1.5 text-xs text-center border rounded-lg transition-all font-normal ${renewMonths === m ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20 text-teal-600' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600'}`}
                                        >
                                            +{m} M
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p className="text-[11px] text-gray-400 font-normal leading-relaxed italic">
                                Action extends contract relative from now. Newly calculated endpoint: {new Date(calculateExpiration(renewTier, renewMonths)).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-150 dark:border-gray-700 flex justify-end gap-2">
                            <button 
                                onClick={() => setIsRenewalModalOpen(false)} 
                                className="px-4 py-2 border border-gray-250 dark:border-gray-700 text-xs font-normal uppercase tracking-wider rounded text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-900"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleExecuteRenewal}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-normal uppercase tracking-wider rounded transition-all shadow shadow-teal-500/10"
                            >
                                Process Renewal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. MODAL: ADD / EDIT GLOBAL USER ACCOUNT */}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveUser} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 space-y-4">
                        <div className="border-b border-gray-150 dark:border-gray-700 pb-3">
                            <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">{targetUser ? 'Edit System Auth Profile' : 'Configure New GRC Identity'}</h3>
                            <p className="text-xs text-gray-500 mt-1 font-normal">Super admin tenant rbac setup portal</p>
                        </div>

                        <div className="space-y-3.5 text-xs text-gray-700 dark:text-gray-300">
                            <div>
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Full Corporate Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={userForm.name} 
                                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm" 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">User Auth Email</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={userForm.email} 
                                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm" 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Reset Password {targetUser && '(Leave empty to preserve)'}</label>
                                <input 
                                    type="text" 
                                    minLength={6}
                                    placeholder={targetUser ? '••••••••' : 'Pass code'}
                                    required={!targetUser}
                                    value={userForm.password} 
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2.5 outline-none text-sm font-mono" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">System Role</label>
                                    <select 
                                        value={userForm.role} 
                                        onChange={e => setUserForm({ ...userForm, role: e.target.value as User['role'] })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2 text-sm outline-none"
                                    >
                                        <option value="CISO">CISO</option>
                                        <option value="Administrator">Administrator</option>
                                        <option value="Super Admin">Super Admin</option>
                                        <option value="internal_admin">internal_admin</option>
                                        <option value="Security Analyst">Security Analyst</option>
                                        <option value="Employee">Employee</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Associated Workspace</label>
                                    <select 
                                        value={userForm.companyId} 
                                        onChange={e => setUserForm({ ...userForm, companyId: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-lg p-2 text-sm outline-none"
                                    >
                                        <option value="">Awaiting Tenant Node link</option>
                                        {allCompanies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-2 font-normal cursor-pointer text-xs">
                                    <input 
                                        type="checkbox" 
                                        checked={userForm.isVerified} 
                                        onChange={e => setUserForm({ ...userForm, isVerified: e.target.checked })}
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                                    />
                                    <span>Auth Email Verified</span>
                                </label>

                                <label className="flex items-center gap-2 font-normal cursor-pointer text-xs">
                                    <input 
                                        type="checkbox" 
                                        checked={userForm.mfaEnabled} 
                                        onChange={e => setUserForm({ ...userForm, mfaEnabled: e.target.checked })}
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" 
                                    />
                                    <span>Enforce MFA Login</span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-150 dark:border-gray-700 flex justify-end gap-2">
                            <button 
                                type="button"
                                onClick={() => setIsUserModalOpen(false)} 
                                className="px-4 py-2 border border-gray-250 dark:border-gray-700 text-xs font-normal uppercase tracking-wider rounded text-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-900"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-normal uppercase tracking-wider rounded transition-all shadow shadow-teal-500/10"
                            >
                                Save Settings
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
