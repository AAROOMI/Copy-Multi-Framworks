
import React, { useEffect, useRef, useMemo, useState } from 'react';
import type { PolicyDocument, User, SearchResult, Domain, DocumentStatus, UserRole, UserTrainingProgress, AssessmentItem, Task, TaskStatus, View, Risk } from '../types';
import { CheckCircleIcon, CloseIcon, DocumentIcon, FundamentalsBadgeIcon, PhishingBadgeIcon, MalwareBadgeIcon, PasswordBadgeIcon, SafeBrowsingBadgeIcon, RemoteWorkBadgeIcon, SecureCodingBadgeIcon, IncidentResponseBadgeIcon, DataPrivacyBadgeIcon, ExclamationTriangleIcon } from './Icons';
import { trainingCourses } from '../data/trainingData';

declare const Chart: any;

interface DashboardPageProps {
    repository: PolicyDocument[];
    currentUser: User;
    allControls: SearchResult[];
    domains: Domain[];
    onSetView: (view: View) => void;
    onSelectDomain: (domain: Domain) => void;
    trainingProgress?: UserTrainingProgress;
    eccAssessment: AssessmentItem[];
    pdplAssessment: AssessmentItem[];
    samaCsfAssessment: AssessmentItem[];
    cmaAssessment: AssessmentItem[];
    tasks: Task[];
    setTasks: (updater: React.SetStateAction<Task[]>) => void;
    risks: Risk[];
}

const statusToRoleMap: Record<string, UserRole> = {
    'Pending CISO Approval': 'CISO',
    'Pending CTO Approval': 'CTO',
    'Pending CIO Approval': 'CIO',
    'Pending CEO Approval': 'CEO',
};

const getStatusColor = (status: DocumentStatus | 'Not Covered', opacity = 1) => {
    switch (status) {
        case 'Approved': return `rgba(16, 185, 129, ${opacity})`; // green-500
        case 'Rejected': return `rgba(239, 68, 68, ${opacity})`; // red-500
        case 'Pending CISO Approval':
        case 'Pending CTO Approval':
        case 'Pending CIO Approval':
        case 'Pending CEO Approval': return `rgba(245, 158, 11, ${opacity})`; // amber-500
        case 'Not Covered': return `rgba(107, 114, 128, ${opacity})`; // gray-500
        default: return `rgba(156, 163, 175, ${opacity})`; // gray-400
    }
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        {children}
    </div>
);

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <Card>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
        <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {description && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </Card>
);

const OverallComplianceChart: React.FC<{ percentage: number }> = ({ percentage }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || !Chart) return;

        const isDark = document.documentElement.classList.contains('dark');
        const trackColor = isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 1)';
        const textColor = isDark ? 'rgba(243, 244, 246, 1)' : 'rgba(17, 24, 39, 1)';

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [percentage, 100 - percentage],
                    backgroundColor: [getStatusColor('Approved'), trackColor],
                    borderColor: [getStatusColor('Approved'), trackColor],
                    circumference: 180,
                    rotation: -90,
                    cutout: '80%',
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
            }
        });
        
        return () => chartRef.current?.destroy();

    }, [percentage]);

    return (
        <Card className="flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Overall Compliance</h3>
            <div className="relative w-48 h-24">
                <canvas ref={canvasRef}></canvas>
                <div className="absolute inset-0 flex items-end justify-center">
                    <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">{percentage.toFixed(0)}%</span>
                </div>
            </div>
        </Card>
    );
};

const StatusDistributionChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || !Chart) return;
        
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#E5E7EB' : '#374151';

        const chartData = {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: Object.keys(data).map(status => getStatusColor(status as DocumentStatus, 0.8)),
                borderColor: isDark ? '#1f2937' : '#ffffff',
                borderWidth: 2,
            }]
        };

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new Chart(canvasRef.current, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 15,
                            boxWidth: 12,
                        }
                    },
                }
            }
        });

        return () => chartRef.current?.destroy();

    }, [data]);
    
    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Document Status</h3>
            <div className="h-64">
                <canvas ref={canvasRef} />
            </div>
        </Card>
    );
};

const DomainComplianceChart: React.FC<{ data: { name: string, compliance: number }[], onSelectDomain: (name: string) => void }> = ({ data, onSelectDomain }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || !Chart) return;
        
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#E5E7EB' : '#4B5563';
        const gridColor = isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 1)';
        
        const chartData = {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Compliance %',
                data: data.map(d => d.compliance),
                backgroundColor: getStatusColor('Approved', 0.7),
                borderColor: getStatusColor('Approved'),
                borderWidth: 1,
                borderRadius: 4,
            }]
        };

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new Chart(canvasRef.current, {
            type: 'bar',
            data: chartData,
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                onClick: (e: any, elements: any) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const domainName = data[index].name;
                        onSelectDomain(domainName);
                    }
                },
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: gridColor },
                        ticks: { color: textColor, callback: (value: any) => `${value}%` },
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [data, onSelectDomain]);

    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Compliance by Domain</h3>
            <div className="h-96">
                <canvas ref={canvasRef}></canvas>
            </div>
        </Card>
    );
};

const BadgeIcon: React.FC<{ badgeId: string }> = ({ badgeId }) => {
    const props = { className: "w-12 h-12 text-teal-600 dark:text-teal-400" };
    const course = trainingCourses.find(c => c.badgeId === badgeId);

    const iconMap: Record<string, React.ReactNode> = {
        'fundamentals-badge': <FundamentalsBadgeIcon {...props} />,
        'phishing-badge': <PhishingBadgeIcon {...props} />,
        'malware-badge': <MalwareBadgeIcon {...props} />,
        'password-badge': <PasswordBadgeIcon {...props} />,
        'browsing-badge': <SafeBrowsingBadgeIcon {...props} />,
        'remote-work-badge': <RemoteWorkBadgeIcon {...props} />,
        'secure-coding-badge': <SecureCodingBadgeIcon {...props} />,
        'incident-response-badge': <IncidentResponseBadgeIcon {...props} />,
        'data-privacy-badge': <DataPrivacyBadgeIcon {...props} />,
    };

    return (
        <div className="text-center">
            {iconMap[badgeId] || null}
            <p className="text-xs mt-1 font-semibold text-gray-600 dark:text-gray-400">{course?.title.replace('Cybersecurity ', '').replace('Awareness', '').replace('Security', '')}</p>
        </div>
    );
}

const FrameworkMeter: React.FC<{
    title: string;
    percentage: number;
    onNavigate?: () => void;
    disabled?: boolean;
}> = ({ title, percentage, onNavigate, disabled = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || !Chart) return;

        const isDark = document.documentElement.classList.contains('dark');
        const trackColor = isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 1)';
        
        const getColor = (value: number) => {
            if (disabled) return `rgba(156, 163, 175, 1)`; // gray-400
            if (value < 50) return `rgba(239, 68, 68, 1)`; // red-500
            if (value < 80) return `rgba(245, 158, 11, 1)`; // amber-500
            return `rgba(16, 185, 129, 1)`; // green-500
        };

        const filledColor = getColor(percentage);

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [percentage, 100 - percentage],
                    backgroundColor: [filledColor, trackColor],
                    borderColor: 'transparent',
                    borderWidth: 0,
                    circumference: 270,
                    rotation: -135,
                    cutout: '80%',
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
            }
        });
        
        return () => chartRef.current?.destroy();

    }, [percentage, disabled]);

    return (
        <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center justify-between ${disabled ? 'opacity-60' : ''}`}>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 text-center">{title}</h3>
            <div className="relative w-32 h-32 my-4">
                <canvas ref={canvasRef}></canvas>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-bold text-gray-900 dark:text-gray-100 ${disabled ? 'text-gray-500' : ''}`}>
                        {disabled ? 'N/A' : `${percentage.toFixed(0)}%`}
                    </span>
                </div>
            </div>
            {onNavigate && !disabled ? (
                 <button onClick={onNavigate} className="w-full text-center py-2 px-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                    View Details
                </button>
            ) : (
                 <button disabled className="w-full text-center py-2 px-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 dark:bg-gray-600 cursor-not-allowed">
                    {disabled ? 'Not Started' : 'View Details'}
                </button>
            )}
        </div>
    );
};

const TaskManager: React.FC<{
    tasks: Task[];
    setTasks: (updater: React.SetStateAction<Task[]>) => void;
    controls: SearchResult[];
}> = ({ tasks, setTasks, controls }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskControlId, setNewTaskControlId] = useState('');

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: newTaskTitle.trim(),
            controlId: newTaskControlId || undefined,
            status: 'To Do',
            createdAt: Date.now(),
        };

        setTasks(prev => [newTask, ...prev]);
        setNewTaskTitle('');
        setNewTaskControlId('');
    };
    
    const handleToggleStatus = (taskId: string) => {
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                const nextStatus: Record<TaskStatus, TaskStatus> = {
                    'To Do': 'In Progress',
                    'In Progress': 'Done',
                    'Done': 'To Do',
                };
                return { ...task, status: nextStatus[task.status] };
            }
            return task;
        }));
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
    };

    const sortedTasks = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = { 'To Do': [], 'In Progress': [], 'Done': [] };
        tasks.forEach(task => grouped[task.status].push(task));
        // Sort within groups by creation date
        Object.values(grouped).forEach(group => group.sort((a, b) => b.createdAt - a.createdAt));
        return grouped;
    }, [tasks]);

    const statusConfig: Record<TaskStatus, { color: string; ringColor: string; title: string }> = {
        'To Do': { color: 'bg-gray-400', ringColor: 'ring-gray-300', title: 'To Do' },
        'In Progress': { color: 'bg-blue-500', ringColor: 'ring-blue-300', title: 'In Progress' },
        'Done': { color: 'bg-green-500', ringColor: 'ring-green-300', title: 'Done' },
    };

    return (
        <Card className="flex flex-col h-full">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">My Tasks</h3>
            <form onSubmit={handleAddTask} className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-grow block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
                />
                <select
                    value={newTaskControlId}
                    onChange={(e) => setNewTaskControlId(e.target.value)}
                    className="block w-48 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
                >
                    <option value="">Link Control (Optional)</option>
                    {controls.map(c => <option key={c.control.id} value={c.control.id}>{c.control.id}</option>)}
                </select>
                <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700">Add</button>
            </form>
            <div className="flex-grow overflow-y-auto pr-2 min-h-[300px]">
                {(['To Do', 'In Progress', 'Done'] as TaskStatus[]).map(status => (
                    sortedTasks[status].length > 0 && (
                        <div key={status} className="mb-4">
                             <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{status}</h4>
                            <ul className="space-y-2">
                                {sortedTasks[status].map(task => (
                                    <li key={task.id} className="flex items-center gap-3 p-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
                                        <button onClick={() => handleToggleStatus(task.id)} title={`Change status from ${task.status}`}>
                                            <div className={`w-5 h-5 rounded-full ${statusConfig[task.status].color} ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900/50 ${statusConfig[task.status].ringColor}`}></div>
                                        </button>
                                        <div className="flex-grow">
                                            <p className="text-sm text-gray-800 dark:text-gray-200">{task.title}</p>
                                            {task.controlId && <span className="text-xs font-mono px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{task.controlId}</span>}
                                        </div>
                                        <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-500">
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                ))}
            </div>
        </Card>
    );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ repository, currentUser, allControls, domains, onSetView, onSelectDomain, trainingProgress, eccAssessment, pdplAssessment, samaCsfAssessment, cmaAssessment, tasks, setTasks, risks }) => {
    const stats = useMemo(() => {
        const approvedCount = repository.filter(doc => doc.status === 'Approved').length;
        const pendingCount = repository.filter(doc => doc.status.startsWith('Pending')).length;
        const totalControls = allControls.length;
        const coverage = (repository.length / totalControls) * 100;
        const compliance = (approvedCount / totalControls) * 100;
        
        return { approvedCount, pendingCount, coverage, compliance, totalControls };
    }, [repository, allControls]);

    const riskStats = useMemo(() => {
        // Calculate based on Residual Score
        // High > 10, Critical > 15
        const critical = risks.filter(r => (r.residualScore || 0) > 15).length;
        const high = risks.filter(r => (r.residualScore || 0) > 10 && (r.residualScore || 0) <= 15).length;
        const total = risks.length;
        return { critical, high, total };
    }, [risks]);

    const myApprovalTasks = useMemo(() => {
        if (!currentUser) return [];
        return repository.filter(doc => statusToRoleMap[doc.status] === currentUser.role);
    }, [repository, currentUser]);

    const statusDistribution = useMemo(() => {
        const distribution: Record<string, number> = {};
        repository.forEach(doc => {
            distribution[doc.status] = (distribution[doc.status] || 0) + 1;
        });
        return distribution;
    }, [repository]);

    const domainCompliance = useMemo(() => {
        return domains.map(domain => {
            const controlsInDomain = allControls.filter(c => c.domain.id === domain.id);
            const approvedDocsInDomain = repository.filter(doc => 
                doc.status === 'Approved' && controlsInDomain.some(c => c.control.id === doc.controlId)
            );
            const compliance = controlsInDomain.length > 0 ? (approvedDocsInDomain.length / controlsInDomain.length) * 100 : 0;
            return { name: domain.name, compliance };
        });
    }, [domains, allControls, repository]);
    
    const recentActivity = useMemo(() => {
        return [...repository]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 5);
    }, [repository]);
    
    const earnedBadges = useMemo(() => {
        if (!trainingProgress) return [];
        // FIX: Add type assertion to resolve 'unknown' type from Object.values on a potentially empty object.
        return Object.values(trainingProgress as UserTrainingProgress)
            .filter((p) => p.badgeEarned)
            .map(p => p.badgeId);
    }, [trainingProgress]);

    const calculateCompliance = (data: AssessmentItem[]) => {
        if (!data || data.length === 0) return 0;
        const applicable = data.filter(i => i.controlStatus !== 'Not Applicable').length;
        const implemented = data.filter(i => i.controlStatus === 'Implemented').length;
        return applicable > 0 ? (implemented / applicable) * 100 : 0;
    };

    const eccCompliance = useMemo(() => calculateCompliance(eccAssessment), [eccAssessment]);
    const pdplCompliance = useMemo(() => calculateCompliance(pdplAssessment), [pdplAssessment]);
    const samaCsfCompliance = useMemo(() => calculateCompliance(samaCsfAssessment), [samaCsfAssessment]);
    const cmaCompliance = useMemo(() => calculateCompliance(cmaAssessment), [cmaAssessment]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Compliance Dashboard</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Welcome, {currentUser?.name}. Here's your compliance overview.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <OverallComplianceChart percentage={stats.compliance} />
                <StatCard title="Control Coverage" value={`${stats.coverage.toFixed(0)}%`} description={`${repository.length} of ${stats.totalControls} controls have documents.`} />
                <StatCard title="Approved Policies" value={stats.approvedCount} description="Fully implemented controls." />
                
                {/* Risk Posture Card */}
                <Card>
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Risk Posture</h3>
                        <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{riskStats.critical}</p>
                            <p className="text-xs font-semibold text-red-600 uppercase">Critical Risks</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{riskStats.high}</p>
                            <p className="text-xs font-semibold text-orange-500 uppercase">High Risks</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onSetView('riskAssessment')} 
                        className="mt-4 w-full text-xs font-medium text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 text-right"
                    >
                        View Risk Register &rarr;
                    </button>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Frameworks Compliance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <FrameworkMeter 
                        title="NCA ECC" 
                        percentage={eccCompliance} 
                        onNavigate={() => onSetView('assessment')}
                    />
                    <FrameworkMeter 
                        title="PDPL" 
                        percentage={pdplCompliance} 
                        onNavigate={() => onSetView('pdplAssessment')}
                    />
                    <FrameworkMeter 
                        title="SAMA CSF" 
                        percentage={samaCsfCompliance} 
                        onNavigate={() => onSetView('samaCsfAssessment')}
                    />
                    <FrameworkMeter 
                        title="CMA" 
                        percentage={cmaCompliance} 
                        onNavigate={() => onSetView('cmaAssessment')}
                        disabled={false}
                    />
                    <FrameworkMeter 
                        title="BCMS (ISO 22301)" 
                        percentage={0} 
                        onNavigate={() => window.open('https://resilienceos-iso-22301-master-496821664990.us-west1.run.app', '_blank')}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TaskManager tasks={tasks} setTasks={setTasks} controls={allControls} />
                </div>
                 <Card>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">My Approval Tasks ({myApprovalTasks.length})</h3>
                    {myApprovalTasks.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[420px] overflow-y-auto">
                           {myApprovalTasks.map(task => (
                                <li key={task.id} className="py-3 flex items-center justify-between">
                                   <div>
                                     <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{task.controlId}</p>
                                     <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-60">{task.controlDescription}</p>
                                   </div>
                                    <button onClick={() => onSetView('documents')} className="text-sm font-semibold text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200">
                                        View
                                    </button>
                                </li>
                           ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No pending approvals. Great job!</p>
                    )}
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <DomainComplianceChart 
                        data={domainCompliance} 
                        onSelectDomain={(name) => {
                            const domain = domains.find(d => d.name === name);
                            if (domain) onSelectDomain(domain);
                        }}
                    />
                </div>
                <div className="lg:col-span-2">
                    <StatusDistributionChart data={statusDistribution} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Activity</h3>
                    <ul className="space-y-4">
                        {recentActivity.map(doc => (
                            <li key={doc.id} className="flex items-start space-x-3">
                                <div className={`mt-1 flex-shrink-0 h-5 w-5 rounded-full`} style={{ backgroundColor: getStatusColor(doc.status) }}></div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">{doc.controlId}</span> was updated to <span className="font-semibold">{doc.status}</span>.
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(doc.updatedAt).toLocaleString()}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">My Achievements</h3>
                    {earnedBadges.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-8 py-4">
                            {earnedBadges.map(badgeId => <BadgeIcon key={badgeId} badgeId={badgeId} />)}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Start a course in the "Training & Awareness" section to earn badges.
                            </p>
                             <button onClick={() => onSetView('training')} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">
                                Go to Training
                            </button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
