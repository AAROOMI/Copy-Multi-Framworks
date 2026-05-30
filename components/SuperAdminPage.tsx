
import React, { useState, useEffect } from 'react';
import { dbAPI } from '../db';
import type { CompanyProfile, User, License } from '../types';
import { BuildingOfficeIcon, UsersIcon, LockClosedIcon, SearchIcon, TrashIcon, CheckCircleIcon } from './Icons';

interface SuperAdminPageProps {
    currentUser: User;
}

type AdminTab = 'provisioning' | 'licenses' | 'users' | 'companies';

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('provisioning');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Provisioning State
    const [companyName, setCompanyName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [subscriptionTier, setSubscriptionTier] = useState<License['tier']>('yearly');

    // Data Management State
    const [allCompanies, setAllCompanies] = useState<CompanyProfile[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [generatedKey, setGeneratedKey] = useState('');

    useEffect(() => {
        if (activeTab === 'companies' || activeTab === 'licenses') {
            fetchCompanies();
        } else if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const data = await dbAPI.getAllCompanies();
            setAllCompanies(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await dbAPI.getAllUsers();
            setAllUsers(data);
        } catch (e) {
            console.error(e);
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
            setMessage({ text: `Successfully created company "${companyName}" and admin "${adminEmail}".`, type: 'success' });
            setCompanyName(''); setAdminName(''); setAdminEmail(''); setAdminPassword('');
        } catch (error: any) {
            setMessage({ text: error.message || "Failed to create company system.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const generateStandaloneKey = () => {
        const key = `SA-KEY-${Math.random().toString(36).substring(2, 14).toUpperCase()}`;
        setGeneratedKey(key);
    };

    const calculateExpiration = (tier: License['tier']): number => {
        const now = new Date();
        let months = 12;
        if (tier === 'monthly') months = 1;
        if (tier === 'quarterly') months = 3;
        if (tier === 'semi-annually') months = 6;
        if (tier === 'trial') months = 0.25;
        return new Date(now.setMonth(now.getMonth() + months)).getTime();
    };

    // Filtered data
    const filteredUsers = allUsers.filter(u => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCompanies = allCompanies.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-normal text-gray-900 dark:text-white uppercase tracking-tight">System Admin Console</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono uppercase tracking-widest mt-1">Global Infrastructure & License Management</p>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button onClick={() => setActiveTab('provisioning')} className={`px-4 py-1.5 text-[11px] font-normal uppercase tracking-wider rounded-md transition-all ${activeTab === 'provisioning' ? 'bg-white dark:bg-gray-700 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Provisioning</button>
                    <button onClick={() => setActiveTab('licenses')} className={`px-4 py-1.5 text-[11px] font-normal uppercase tracking-wider rounded-md transition-all ${activeTab === 'licenses' ? 'bg-white dark:bg-gray-700 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Licenses</button>
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-1.5 text-[11px] font-normal uppercase tracking-wider rounded-md transition-all ${activeTab === 'users' ? 'bg-white dark:bg-gray-700 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Users</button>
                    <button onClick={() => setActiveTab('companies')} className={`px-4 py-1.5 text-[11px] font-normal uppercase tracking-wider rounded-md transition-all ${activeTab === 'companies' ? 'bg-white dark:bg-gray-700 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Companies</button>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-md flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200 shadow-sm' : 'bg-red-50 text-red-800 border border-red-200 shadow-sm'}`}>
                    {message.type === 'success' ? <CheckCircleIcon className="w-5 h-5 flex-shrink-0" /> : <LockClosedIcon className="w-5 h-5 flex-shrink-0" />}
                    <span className="text-sm">{message.text}</span>
                </div>
            )}

            {activeTab === 'provisioning' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                        <h2 className="text-sm font-normal text-teal-600 dark:text-teal-400 flex items-center uppercase tracking-widest">
                            <BuildingOfficeIcon className="w-5 h-5 mr-3" />
                            Client Organization Provisioning
                        </h2>
                    </div>
                    <form onSubmit={handleProvisioningSubmit} className="p-8 space-y-10">
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Company Identity</h3>
                                <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-widest">Organization master record setup.</p>
                            </div>
                            <div className="lg:col-span-2">
                                <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Organization Legal Name</label>
                                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none" placeholder="e.g. Saudi Aramco" />
                            </div>
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-gray-100 dark:border-gray-800 pt-10">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">Master Administrative Account</h3>
                                <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-widest">Initial CISO/System Admin credentials.</p>
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Administrator Full Name</label>
                                    <input type="text" required value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Corporate Email Address</label>
                                    <input type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-sm outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Secure Initial Password</label>
                                    <input type="password" required minLength={8} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-sm outline-none font-mono" />
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-gray-100 dark:border-gray-800 pt-10">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wider">License Assignment</h3>
                                <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-widest">Select subscription parameters.</p>
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                {(['trial', 'monthly', 'quarterly', 'semi-annually', 'yearly'] as const).map(tier => (
                                    <button key={tier} type="button" onClick={() => setSubscriptionTier(tier)} className={`py-4 px-4 border rounded-xl flex flex-col items-center justify-center transition-all ${subscriptionTier === tier ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400 ring-2 ring-teal-500/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-teal-300'}`}>
                                        <span className="text-[10px] font-normal uppercase tracking-widest">{tier}</span>
                                        <span className="text-[9px] text-gray-400 mt-1">{tier === 'trial' ? '7 Days' : tier === 'monthly' ? '30 Days' : '365 Days'}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                            <button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg text-xs font-normal uppercase tracking-widest shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50">
                                {isLoading ? 'Generating Infrastructure...' : 'Provision Client System'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'licenses' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-sm font-normal text-teal-600 uppercase tracking-widest flex items-center">
                                <LockClosedIcon className="w-5 h-5 mr-3" />
                                Standalone License Generator
                            </h2>
                        </div>
                        <div className="p-8 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1 w-full">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Generated Secure License Key</p>
                                <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 flex items-center justify-between">
                                    <span className="font-mono text-lg text-gray-900 dark:text-white">{generatedKey || '---- ---- ---- ----'}</span>
                                    {generatedKey && <button onClick={() => navigator.clipboard.writeText(generatedKey)} className="text-teal-600 text-[10px] font-normal uppercase tracking-widest hover:underline">Copy Key</button>}
                                </div>
                            </div>
                            <button onClick={generateStandaloneKey} className="bg-gray-900 dark:bg-teal-600 text-white px-8 py-4 rounded-xl text-xs uppercase tracking-widest hover:opacity-90 transition-all font-normal">Generate New Code</button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                             <h2 className="text-sm font-normal text-gray-800 dark:text-gray-100 uppercase tracking-widest">Active System Licenses</h2>
                        </div>
                        <div className="overflow-x-auto font-mono">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">Company</th>
                                        <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">License Key</th>
                                        <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">Tier</th>
                                        <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">Expires</th>
                                        <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {allCompanies.map(c => (
                                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all">
                                            <td className="px-6 py-4 text-xs font-sans font-normal">{c.name}</td>
                                            <td className="px-6 py-4 text-xs font-mono">{c.license?.key}</td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-[9px] uppercase font-sans">{c.license?.tier}</span></td>
                                            <td className="px-6 py-4 text-[10px] text-gray-500">{c.license ? new Date(c.license.expiresAt).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[9px] uppercase font-sans ${c.license?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {c.license?.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-sm font-normal text-teal-600 uppercase tracking-widest flex items-center">
                            <UsersIcon className="w-5 h-5 mr-3" />
                            Global Master User Directory
                        </h2>
                        <div className="relative">
                            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-xs w-full md:w-64 focus:ring-1 focus:ring-teal-500 outline-none" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">Identity</th>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">Corporate Email</th>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">System Role</th>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">Organization ID</th>
                                    <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all font-normal">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center text-teal-700 dark:text-teal-300 text-xs font-normal mr-3">{user.name.charAt(0)}</div>
                                                <span className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-tight">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-400">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[9px] uppercase tracking-widest border ${user.role === 'Super Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{user.role}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-400 uppercase">{user.companyId || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            {user.isVerified ? 
                                                <span className="flex items-center text-green-600 text-[10px] uppercase tracking-widest font-normal"><CheckCircleIcon className="w-3 h-3 mr-1" /> Active</span> :
                                                <span className="flex items-center text-amber-600 text-[10px] uppercase tracking-widest font-normal">Pending</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && <div className="p-12 text-center text-gray-400 text-xs uppercase tracking-widest">No master records found matching criteria</div>}
                    </div>
                </div>
            )}

            {activeTab === 'companies' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCompanies.map(comp => (
                        <div key={comp.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                        <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest font-normal border ${comp.license?.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{comp.license?.status}</span>
                                </div>
                                <h3 className="text-base font-normal text-gray-900 dark:text-white uppercase tracking-tight">{comp.name}</h3>
                                <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-widest">ID: {comp.id}</p>
                                
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
                                        <span className="text-gray-400">Plan Tier</span>
                                        <span className="text-teal-600 font-normal">{comp.license?.tier}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
                                        <span className="text-gray-400">Expiration</span>
                                        <span className="text-gray-600 dark:text-gray-300 font-mono">{comp.license ? new Date(comp.license.expiresAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6">
                                <button onClick={() => {}} className="w-full bg-gray-50 dark:bg-gray-900 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-600 dark:text-gray-400 hover:text-teal-600 py-2 rounded-lg text-[10px] uppercase tracking-widest border border-gray-200 dark:border-gray-700 transition-all font-normal">View Organization Details</button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setActiveTab('provisioning')} className="border-4 border-dashed border-gray-100 dark:border-gray-800 hover:border-teal-500/50 rounded-xl p-12 text-center transition-all group">
                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-500 transition-all">
                            <BuildingOfficeIcon className="w-6 h-6 text-gray-300 group-hover:text-white" />
                        </div>
                        <span className="text-[11px] font-normal text-gray-400 uppercase tracking-widest">New Organization</span>
                    </button>
                    {filteredCompanies.length === 0 && searchQuery && <div className="col-span-full text-center py-12 text-gray-400 text-xs italic">No companies matching your search.</div>}
                </div>
            )}
        </div>
    );
};
