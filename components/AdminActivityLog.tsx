import React, { useState, useMemo } from 'react';
import type { AuditLogEntry, User } from '../types';

interface AdminActivityLogProps {
    auditLog: AuditLogEntry[];
    users: User[];
}

export const AdminActivityLog: React.FC<AdminActivityLogProps> = ({ auditLog, users }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    // Identify user IDs for administrators
    const adminUserIds = useMemo(() => {
        return new Set(
            users
                .filter(u => u.role === 'internal_admin' || u.role === 'Super Admin' || u.email === 'aaroomi@gmail.com')
                .map(u => u.id)
        );
    }, [users]);

    // Filter audits specifically for internal_admin actions
    const filteredLogs = useMemo(() => {
        return auditLog.filter(log => {
            const isByAdminUser = adminUserIds.has(log.userId) 
                || log.userName.toLowerCase().includes('admin')
                || log.userName.toLowerCase().includes('aaroomi');
            
            if (!isByAdminUser) {
                return false;
            }

            if (!searchQuery) return true;
            
            const term = searchQuery.toLowerCase();
            return (
                log.action.toLowerCase().includes(term) ||
                log.details.toLowerCase().includes(term) ||
                log.userName.toLowerCase().includes(term)
            );
        });
    }, [auditLog, adminUserIds, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredLogs.slice(start, start + PAGE_SIZE);
    }, [filteredLogs, currentPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Export as CSV
    const handleExportCsv = () => {
        const headers = ['Log ID', 'Timestamp', 'Date & Time', 'User ID', 'User Name', 'Action', 'Details', 'Target ID'];
        const rows = filteredLogs.map(log => [
            log.id,
            log.timestamp,
            new Date(log.timestamp).toISOString(),
            log.userId,
            log.userName,
            log.action,
            `"${log.details.replace(/"/g, '""')}"`,
            log.targetId || ''
        ]);

        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `internal_admin_activity_log_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-sm font-normal text-teal-700 dark:text-teal-400 font-mono tracking-wider uppercase">Internal Admin Activity Audit Log</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">Real-time monitoring and immutable recording of all elevated system actions.</p>
                </div>
                <button 
                    onClick={handleExportCsv}
                    className="text-xs font-normal bg-teal-650 hover:bg-teal-700 text-white px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 focus:outline-none"
                >
                    <span>Export CSV</span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
                <input 
                    type="text" 
                    placeholder="Search logs by action or details..." 
                    value={searchQuery} 
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md text-gray-900 dark:text-white font-normal outline-none focus:ring-1 focus:ring-teal-500" 
                />
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-left divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 text-[11px] font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date & Time</th>
                            <th className="px-4 py-3 text-[11px] font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 text-[11px] font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                            <th className="px-4 py-3 text-[11px] font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {paginatedLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 font-normal">
                                <td className="px-4 py-3 text-[11px] font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    <span className="block font-normal">{log.userName}</span>
                                    <span className="block text-[9px] text-gray-400 font-mono">ID: {log.userId}</span>
                                </td>
                                <td className="px-4 py-3 text-xs whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100/30 dark:border-amber-900/30">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm overflow-hidden text-ellipsis">
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredLogs.length === 0 && (
                    <div className="p-6 text-center text-gray-450 dark:text-gray-400 text-xs font-normal">
                        No administrative log entries recorded.
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-gray-500 dark:text-gray-400 font-normal">
                        Logs {Math.min(filteredLogs.length, (currentPage - 1) * PAGE_SIZE + 1)} - {Math.min(filteredLogs.length, currentPage * PAGE_SIZE)} of {filteredLogs.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)} 
                            disabled={currentPage === 1}
                            className="px-2.5 py-1 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 disabled:opacity-50 font-normal transition-all"
                        >
                            Previous
                        </button>
                        <button 
                            onClick={() => handlePageChange(currentPage + 1)} 
                            disabled={currentPage === totalPages}
                            className="px-2.5 py-1 border border-gray-200 dark:border-gray-700 rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 disabled:opacity-50 font-normal transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
