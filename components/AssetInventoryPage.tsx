
import React, { useState, useMemo } from 'react';
import type { Asset, AssetType, AssetCriticality, Permission, AuditAction } from '../types';
import { SearchIcon, CloseIcon, ShieldCheckIcon, BugAntIcon, TrashIcon } from './Icons';

interface AssetInventoryPageProps {
    assets: Asset[];
    onAddAsset: (asset: Asset) => void;
    onUpdateAsset: (asset: Asset) => void;
    onDeleteAsset: (assetId: string) => void;
    onScanAsset: (asset: Asset) => void; // Navigates to VAPT
    permissions: Set<Permission>;
    addNotification: (message: string, type?: 'success' | 'info') => void;
    addAuditLog: (action: AuditAction, details: string, targetId?: string) => void;
}

const AssetFormModal: React.FC<{
    asset: Asset | null;
    onClose: () => void;
    onSave: (asset: Asset) => void;
}> = ({ asset, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Asset>>({
        name: '',
        type: 'Server',
        ipAddress: '',
        location: '',
        owner: '',
        criticality: 'Medium',
        tags: []
    });
    const [tagInput, setTagInput] = useState('');

    React.useEffect(() => {
        if (asset) {
            setFormData(asset);
        }
    }, [asset]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: asset?.id || `asset-${Date.now()}`,
            lastScanned: asset?.lastScanned
        } as Asset);
    };

    const addTag = () => {
        if(tagInput.trim()) {
            setFormData(prev => ({...prev, tags: [...(prev.tags || []), tagInput.trim()]}));
            setTagInput('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{asset ? 'Edit Asset' : 'Add New Asset'}</h3>
                    <button onClick={onClose}><CloseIcon className="w-5 h-5 text-gray-500" /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asset Name</label>
                        <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                            <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2"
                                value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as AssetType})}>
                                <option value="Server">Server</option>
                                <option value="Workstation">Workstation</option>
                                <option value="Network Device">Network Device</option>
                                <option value="Application">Application</option>
                                <option value="Database">Database</option>
                                <option value="Cloud Resource">Cloud Resource</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Criticality</label>
                            <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2"
                                value={formData.criticality} onChange={e => setFormData({...formData, criticality: e.target.value as AssetCriticality})}>
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IP Address / URL</label>
                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2" 
                            value={formData.ipAddress} onChange={e => setFormData({...formData, ipAddress: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2" 
                            value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner</label>
                        <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2" 
                            value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-gray-700 dark:text-gray-200">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">Save Asset</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const AssetInventoryPage: React.FC<AssetInventoryPageProps> = ({ 
    assets, onAddAsset, onUpdateAsset, onDeleteAsset, onScanAsset, permissions, addNotification, addAuditLog 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  asset.ipAddress?.includes(searchTerm) || 
                                  asset.owner.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'All' || asset.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [assets, searchTerm, typeFilter]);

    const handleSaveAsset = (asset: Asset) => {
        if (editingAsset) {
            onUpdateAsset(asset);
            addNotification("Asset updated successfully.", "success");
            addAuditLog('ASSET_UPDATED', `Updated asset ${asset.name}`, asset.id);
        } else {
            onAddAsset(asset);
            addNotification("Asset added successfully.", "success");
            addAuditLog('ASSET_CREATED', `Created new asset ${asset.name}`, asset.id);
        }
        setIsModalOpen(false);
        setEditingAsset(null);
    };

    const handleDelete = (asset: Asset) => {
        if (window.confirm(`Are you sure you want to delete ${asset.name}?`)) {
            onDeleteAsset(asset.id);
            addNotification("Asset deleted.", "info");
            addAuditLog('ASSET_DELETED', `Deleted asset ${asset.name}`, asset.id);
        }
    };

    const getCriticalityColor = (level: AssetCriticality) => {
        switch(level) {
            case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Asset Inventory</h1>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Track and manage your organization's critical assets.</p>
                </div>
                {permissions.has('assets:create') && (
                    <button onClick={() => { setEditingAsset(null); setIsModalOpen(true); }} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">
                        + Add Asset
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, IP, or owner..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="block w-48 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                        <option value="All">All Types</option>
                        <option value="Server">Server</option>
                        <option value="Workstation">Workstation</option>
                        <option value="Application">Application</option>
                        <option value="Database">Database</option>
                        <option value="Cloud Resource">Cloud Resource</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Criticality</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner / Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Scan</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredAssets.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No assets found.</td></tr>
                        ) : (
                            filteredAssets.map(asset => (
                                <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{asset.name}</div>
                                        <div className="text-xs text-gray-500">{asset.ipAddress}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            <ShieldCheckIcon className="w-3 h-3 mr-1"/> {asset.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCriticalityColor(asset.criticality)}`}>
                                            {asset.criticality}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <div>{asset.owner}</div>
                                        <div className="text-xs opacity-75">{asset.location}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {asset.lastScanned ? new Date(asset.lastScanned).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                                        {permissions.has('vapt:manage') && (
                                            <button onClick={() => onScanAsset(asset)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="Scan with VAPT">
                                                <BugAntIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        {permissions.has('assets:update') && (
                                            <button onClick={() => { setEditingAsset(asset); setIsModalOpen(true); }} className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300">Edit</button>
                                        )}
                                        {permissions.has('assets:delete') && (
                                            <button onClick={() => handleDelete(asset)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <AssetFormModal asset={editingAsset} onClose={() => setIsModalOpen(false)} onSave={handleSaveAsset} />}
        </div>
    );
};
