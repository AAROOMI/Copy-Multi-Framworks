


import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogoIcon, ShieldCheckIcon, UserGroupIcon, ChartPieIcon, SunIcon, MoonIcon, CheckIcon, ClipboardIcon, ChatBotIcon, EyeIcon, EyeSlashIcon } from './Icons';
import { MetaMaskService } from '../services/metaMaskService';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{error: string, code?: string} | null>;
  onMetaMaskLogin: (address: string) => Promise<{error: string} | null>;
  onGoogleLogin: () => Promise<{error: string} | null>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onSetupCompany: () => void;
  onVerify: (email: string) => boolean;
  onForgotPassword: (email: string) => Promise<{ success: boolean; message: string; token?: string }>;
  onResetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <motion.div 
        whileHover={{ translateY: -5 }}
        className="flex flex-col items-center p-6 text-center glass-panel bg-white/5 border-white/10 rounded-2xl shadow-xl"
    >
        <div className="p-3 bg-teal-500/20 rounded-full text-teal-400">
            {icon}
        </div>
        <h3 className="mt-4 text-[13px] font-bold text-white uppercase tracking-widest">{title}</h3>
        <p className="mt-2 text-[11px] text-slate-400 leading-relaxed font-normal">{children}</p>
    </motion.div>
);

const SignInView: React.FC<Omit<LoginPageProps, 'theme' | 'toggleTheme' | 'onSetupCompany' | 'onForgotPassword' | 'onResetPassword'> & { setView: (view: 'forgotPassword') => void; }> = ({ onLogin, onMetaMaskLogin, onGoogleLogin, onVerify, setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<{message: string, code?: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const loginResult = await onLogin(email, password);
            if (loginResult) {
                setError({ message: loginResult.error, code: loginResult.code });
            }
        } catch (err: any) {
             setError({ message: err.message || "Login failed" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const loginResult = await onGoogleLogin();
            if (loginResult) {
                setError({ message: loginResult.error });
            }
        } catch (err: any) {
            setError({ message: "Google Login failed: " + (err.message || String(err)) });
        }
        setIsLoading(false);
    };

    const handleMetaMaskLogin = async () => {
        setIsLoading(true);
        setError(null);
        const result = await MetaMaskService.connect();
        if ('error' in result) {
            setError({ message: result.error });
        } else {
            const loginResult = await onMetaMaskLogin(result.address);
            if (loginResult) {
                setError({ message: loginResult.error });
            }
        }
        setIsLoading(false);
    };

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Enterprise ID / Email
                </label>
                <div className="mt-1">
                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-[13px] text-white transition-all" 
                        placeholder="aaroomi@gmail.com" />
                </div>
            </div>
            <div>
                <label htmlFor="password" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Access Token / Password
                </label>
                <div className="mt-1 relative">
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-[13px] text-white transition-all" 
                        placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors">
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
             <div className="flex items-center justify-end">
                <div className="text-sm">
                    <button type="button" onClick={() => setView('forgotPassword')} className="text-[11px] font-medium text-teal-400 hover:text-teal-300 transition-colors">
                        Recovery Terminal
                    </button>
                </div>
            </div>
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${error.code === 'unverified' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                >
                    <p className="text-[11px] text-center font-medium leading-relaxed">{error.message}</p>
                    {error.message.includes("MetaMask") && (
                        <button type="button" onClick={handleMetaMaskLogin} className="mt-3 w-full flex justify-center py-2 px-4 border border-teal-500/30 rounded-lg text-xs font-bold text-teal-400 hover:bg-teal-500/10 transition-all uppercase tracking-widest">
                            Retry Connection
                        </button>
                    )}
                </motion.div>
            )}
            <div className="relative group">
                {/* Holographic Button Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="relative w-full flex justify-center py-3.5 px-4 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl text-[13px] font-bold text-white uppercase tracking-widest hover:border-white/20 transition-all disabled:opacity-50"
                >
                    {isLoading ? <div className="flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Authenticating...</span>
                    </div> : "Secure Sign-In"}
                </button>
            </div>

            <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
                    <span className="px-3 bg-[#0F172A] text-slate-500">Multimodal Auth</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    type="button" 
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl shadow-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 mr-2" />
                    Google SSO
                </button>
                <button 
                    type="button" 
                    onClick={handleMetaMaskLogin}
                    disabled={isLoading} 
                    className="w-full flex justify-center items-center py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl shadow-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Monkey_Face.svg" alt="MetaMask" className="w-4 h-4 mr-2" />
                    Web3 Wallet
                </button>
            </div>
             <div className="mt-4 pt-4 border-t border-white/5 flex flex-col items-center gap-3">
                <button 
                    type="button" 
                    onClick={() => onLogin('admin@demo.com', 'demo123')}
                    className="text-[10px] font-bold text-slate-500 hover:text-teal-400 uppercase tracking-widest transition-colors"
                >
                    Bypass to Demo Sandbox
                </button>
                <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest">Edge-AI Assessment Mode Active</span>
                </div>
            </div>
        </form>
    );
};

const ForgotPasswordView: React.FC<{ onForgotPassword: LoginPageProps['onForgotPassword']; setView: (view: 'signIn' | 'resetPassword') => void }> = ({ onForgotPassword, setView }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setMessage("Please enter a valid email address.");
            return;
        }
        setIsLoading(true);
        setMessage('');
        setToken(null);
        try {
            const result = await onForgotPassword(email);
            setMessage(result.message);
            if (result.success && result.token) {
                setToken(result.token);
            }
        } catch (err: any) {
            setMessage("Error: " + (err.message || "An error occurred."));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (token) {
            navigator.clipboard.writeText(token).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email-forgot" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Identity Verification Email</label>
                <div className="mt-1">
                    <input id="email-forgot" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-[13px] text-white transition-all" />
                </div>
            </div>
            {message && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl border bg-blue-500/10 border-blue-500/20"
                >
                    <p className="text-[11px] text-center text-blue-400 leading-relaxed">{message}</p>
                    {token && (
                        <div className="mt-4 p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
                            <p className="text-[9px] text-teal-400 text-center mb-3 uppercase tracking-widest px-2">Generated Recovery Token</p>
                            <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-black/40 border border-white/5 shadow-inner">
                                <input type="text" readOnly value={token} className="flex-grow bg-transparent text-[13px] font-mono text-center text-teal-400 focus:outline-none" />
                                <button type="button" onClick={handleCopy} className="p-2 rounded-md hover:bg-white/5 transition-colors">
                                    {isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5 text-teal-400" />}
                                </button>
                            </div>
                            <button type="button" onClick={() => setView('resetPassword')} className="mt-4 w-full py-2.5 bg-teal-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-teal-500 transition-colors shadow-lg shadow-teal-600/20">
                                Initiate Token Authorization &rarr;
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
            <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 bg-[#0F172A] border border-white/10 rounded-xl text-[13px] font-bold text-white uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 hover:border-white/20">
                    {isLoading ? "Broadcasting Recovery Request..." : "Request Recovery Token"}
                </button>
            </div>
            <div className="text-center">
                <button type="button" onClick={() => setView('signIn')} className="text-[11px] font-bold text-slate-500 hover:text-teal-400 uppercase tracking-widest transition-colors">
                    Return to Primary Access Port
                </button>
            </div>
        </form>
    );
};

const ResetPasswordView: React.FC<{ onResetPassword: LoginPageProps['onResetPassword']; setView: (view: 'signIn') => void }> = ({ onResetPassword, setView }) => {
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsLoading(true);
        setError('');
        setMessage('');
        const result = await onResetPassword(token, password);
        if (result.success) {
            setMessage(result.message);
            setTimeout(() => setView('signIn'), 3000);
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="token" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Authorization Token</label>
                <input id="token" name="token" type="text" required value={token} onChange={(e) => setToken(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-[13px] text-white transition-all" />
            </div>
            <div>
                <label htmlFor="new-password" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">New Terminal Token</label>
                <div className="mt-1 relative">
                    <input id="new-password" name="newPassword" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-[13px] text-white transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors">
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="confirm-password" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Confirm Authorization Token</label>
                <div className="mt-1 relative">
                    <input id="confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-[13px] text-white transition-all" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors">
                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            {message && <p className="p-4 rounded-xl border bg-green-500/10 border-green-500/20 text-green-400 text-[11px] text-center font-medium leading-relaxed">{message}</p>}
            {error && <p className="p-4 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400 text-[11px] text-center font-medium leading-relaxed">{error}</p>}
            <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3.5 bg-[#0F172A] border border-white/10 rounded-xl text-[13px] font-bold text-white uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 hover:border-white/20">
                    {isLoading ? "Propagating New Tokens..." : "Establish New Access Protocol"}
                </button>
            </div>
            <div className="text-center">
                <button type="button" onClick={() => setView('signIn')} className="text-[11px] font-bold text-slate-500 hover:text-teal-400 uppercase tracking-widest transition-colors">
                    Re-authenticate &rarr;
                </button>
            </div>
        </form>
    );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onMetaMaskLogin, onGoogleLogin, theme, toggleTheme, onSetupCompany, onVerify, onForgotPassword, onResetPassword }) => {
    const [view, setView] = useState<'signIn' | 'forgotPassword' | 'resetPassword'>('signIn');

    const viewTitles = {
        signIn: 'Secure Access Terminal',
        forgotPassword: 'Key Recovery Protocol',
        resetPassword: 'New Token Generation',
    };
    
    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="absolute top-0 right-0 p-6 z-20">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all shadow-xl backdrop-blur-md"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center mb-8"
                >
                    <div className="p-4 rounded-3xl bg-gradient-to-tr from-teal-500 to-cyan-400 shadow-2xl shadow-teal-500/20">
                        <LogoIcon className="h-12 w-auto text-white" />
                    </div>
                </motion.div>
                <h2 className="text-center text-[10px] font-bold text-teal-400 uppercase tracking-[0.4em] mb-2">
                    ECC COMPLIANCE ORCHESTRATOR
                </h2>
                <h1 className="text-center text-2xl font-bold text-white tracking-tight">
                    {viewTitles[view]}
                </h1>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel bg-white/[0.03] backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-3xl sm:px-10 border border-white/10"
                >
                    {view === 'signIn' && <SignInView onLogin={onLogin} onMetaMaskLogin={onMetaMaskLogin} onGoogleLogin={onGoogleLogin} onVerify={onVerify} setView={setView} />}
                    {view === 'forgotPassword' && <ForgotPasswordView onForgotPassword={onForgotPassword} setView={setView} />}
                    {view === 'resetPassword' && <ResetPasswordView onResetPassword={onResetPassword} setView={setView} />}
                    
                    {view === 'signIn' && (
                        <div className="mt-8 pt-8 border-t border-white/5">
                            <button 
                                type="button" 
                                onClick={onSetupCompany} 
                                className="w-full flex justify-center items-center py-3 px-4 bg-transparent border border-white/5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-white hover:border-white/20 transition-all uppercase tracking-widest"
                            >
                                Initiate New Organization Setup
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
            
            <div className="mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                     <FeatureCard title="Neural Controls" icon={<ShieldCheckIcon className="w-6 h-6"/>}>
                        Adaptive ECC framework mapping with real-time requirement synchronization.
                    </FeatureCard>
                    <FeatureCard title="Noora AI Interface" icon={<ChatBotIcon className="w-6 h-6"/>}>
                        Voice-activated compliance auditing and automated document synthesis.
                    </FeatureCard>
                    <FeatureCard title="Quantum RBAC" icon={<UserGroupIcon className="w-6 h-6"/>}>
                        Cryptographically secure role assignment and granular access telemetry.
                    </FeatureCard>
                    <FeatureCard title="Strategic Insights" icon={<ChartPieIcon className="w-6 h-6"/>}>
                        Multi-dimensional risk visualization and predictive compliance trajectories.
                    </FeatureCard>
                </div>
            </div>
        </div>
    );
};