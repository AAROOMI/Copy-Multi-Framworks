
import React, { useState, useEffect, useRef } from 'react';
import type { AssessmentItem, ControlStatus } from '../types';
import { UploadIcon, PaperClipIcon, CloseIcon } from './Icons';

const allStatuses: ControlStatus[] = ['Implemented', 'Partially Implemented', 'Not Implemented', 'Not Applicable'];

interface EditableControlRowProps {
    item: AssessmentItem;
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    isEditable: boolean;
    canUpdate: boolean;
    index: number;
    isGenerating?: boolean;
    activeField?: keyof AssessmentItem | null;
}

// A component for a single editable control row.
const EditableControlRow: React.FC<EditableControlRowProps> = ({ item, onUpdateItem, isEditable, canUpdate, index, isGenerating, activeField }) => {
    const [localItem, setLocalItem] = useState(item);
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalItem(item);
    }, [item]);

    // Scroll to this row if it is active (any field is highlighted)
    useEffect(() => {
        if (activeField && rowRef.current) {
            rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeField]);

    const handleBlur = () => {
        if (JSON.stringify(localItem) !== JSON.stringify(item)) {
            onUpdateItem(localItem.controlCode, localItem);
            setIsSaving(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => setIsSaving(false), 2000);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalItem(prev => ({...prev, [name]: value}));
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as ControlStatus;
        const newItem = { ...localItem, controlStatus: newStatus };
        setLocalItem(newItem);
        onUpdateItem(newItem.controlCode, newItem);
        setIsSaving(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setIsSaving(false), 2000);

        if (newStatus === 'Implemented' && !newItem.evidence) {
            if (window.confirm("This control is marked as 'Implemented'. It's recommended to upload supporting evidence (e.g., a policy document, screenshot, or report). Would you like to upload a file now?")) {
                fileInputRef.current?.click();
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert("File size cannot exceed 5MB.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                const newItem = {
                    ...localItem,
                    evidence: {
                        fileName: file.name,
                        dataUrl: dataUrl
                    }
                };
                setLocalItem(newItem);
                onUpdateItem(newItem.controlCode, newItem);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeEvidence = () => {
        if (window.confirm("Are you sure you want to remove this evidence?")) {
            const { evidence, ...rest } = localItem;
            const newItem = rest as AssessmentItem;
            setLocalItem(newItem);
            onUpdateItem(newItem.controlCode, newItem);
        }
    };
    
    const isDisabled = !isEditable || !canUpdate;
    
    // Helper to determine active class
    const getFieldClass = (fieldName: keyof AssessmentItem) => {
        const baseClass = "mt-1 block w-full text-sm rounded-md bg-transparent border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 transition-all duration-300";
        if (activeField === fieldName) {
            return `${baseClass} ring-2 ring-teal-500 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)] animate-pulse z-10 relative bg-white dark:bg-gray-800`;
        }
        return baseClass;
    };

    
    return (
         <div ref={rowRef} className={`p-4 border rounded-lg transition-all duration-500 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative ${activeField ? 'border-teal-300 dark:border-teal-800 shadow-md transform scale-[1.01]' : ''}`}>
             {isSaving && (
                 <div className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 animate-fade-out">
                     Saved
                 </div>
            )}
            <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${activeField ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200'}`}>
                    {index + 1}
                </div>
                <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-teal-700 dark:text-teal-300 font-mono">{item.controlCode}</h3>
                    <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{item.controlName}</p>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div className="md:col-span-2">
                            <label htmlFor={`currentStatusDescription-${item.controlCode}`} className={`font-medium transition-colors ${activeField === 'currentStatusDescription' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Current Status Description</label>
                            <textarea
                                id={`currentStatusDescription-${item.controlCode}`}
                                name="currentStatusDescription"
                                value={localItem.currentStatusDescription}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled}
                                rows={2}
                                className={getFieldClass('currentStatusDescription')}
                            />
                        </div>
                        <div>
                             <label htmlFor={`controlStatus-${item.controlCode}`} className={`font-medium transition-colors ${activeField === 'controlStatus' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Control Status</label>
                             <select
                                id={`controlStatus-${item.controlCode}`}
                                name="controlStatus"
                                value={localItem.controlStatus}
                                onChange={handleStatusChange}
                                disabled={isDisabled}
                                className={getFieldClass('controlStatus')}
                            >
                                {allStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="font-medium text-gray-500 dark:text-gray-400">Evidence</label>
                            <div className="mt-1">
                                {localItem.evidence ? (
                                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                                        <a href={localItem.evidence.dataUrl} download={localItem.evidence.fileName} className="text-sm text-teal-600 dark:text-teal-400 hover:underline truncate flex items-center" title={localItem.evidence.fileName}>
                                            <PaperClipIcon className="w-4 h-4 mr-2 flex-shrink-0"/>
                                            <span className="truncate">{localItem.evidence.fileName}</span>
                                        </a>
                                        {isEditable && canUpdate && (
                                            <button onClick={removeEvidence} className="ml-2 text-gray-400 hover:text-red-500 p-1 rounded-full">
                                                <CloseIcon className="w-4 h-4"/>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-400 italic py-2">No evidence uploaded.</div>
                                )}
                                {isEditable && canUpdate && (
                                     <button type="button" onClick={() => fileInputRef.current?.click()} className={`mt-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline flex items-center p-1 rounded-md transition-shadow`}>
                                        <UploadIcon className="w-4 h-4 mr-1"/>
                                        {localItem.evidence ? 'Replace Evidence' : 'Upload Evidence'}
                                     </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                                />
                            </div>
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor={`recommendation-${item.controlCode}`} className={`font-medium transition-colors ${activeField === 'recommendation' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Recommendation</label>
                            <textarea
                                id={`recommendation-${item.controlCode}`}
                                name="recommendation"
                                value={isGenerating ? 'Generating AI recommendation...' : localItem.recommendation}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled || isGenerating}
                                rows={2}
                                className={getFieldClass('recommendation')}
                            />
                        </div>
                        <div>
                             <label htmlFor={`managementResponse-${item.controlCode}`} className={`font-medium transition-colors ${activeField === 'managementResponse' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Management Response</label>
                            <textarea
                                id={`managementResponse-${item.controlCode}`}
                                name="managementResponse"
                                value={localItem.managementResponse}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled}
                                rows={2}
                                className={getFieldClass('managementResponse')}
                            />
                        </div>
                        <div>
                             <label htmlFor={`targetDate-${item.controlCode}`} className={`font-medium transition-colors ${activeField === 'targetDate' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>Target Date</label>
                             <input
                                type="date"
                                id={`targetDate-${item.controlCode}`}
                                name="targetDate"
                                value={localItem.targetDate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled}
                                className={getFieldClass('targetDate')}
                            />
                        </div>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes fade-out {
                    0% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .animate-fade-out {
                    animation: fade-out 2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

interface AssessmentSheetProps {
    filteredDomains: { name: string; items: AssessmentItem[] }[];
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    isEditable: boolean;
    canUpdate: boolean;
    generatingRecommendationFor?: string | null;
    activeControlCode?: string | null;
    activeField?: keyof AssessmentItem | null;
}

export const AssessmentSheet: React.FC<AssessmentSheetProps> = ({ filteredDomains, onUpdateItem, isEditable, canUpdate, generatingRecommendationFor, activeControlCode, activeField }) => {
    
    let controlCounter = 0;

    return (
        <div className="space-y-12">
            {filteredDomains.map(({ name: domainName, items: controls }) => {
                const domainStartIndex = controlCounter;
                controlCounter += controls.length;

                return (
                    <div key={domainName} className="bg-transparent space-y-6">
                        <h2 id={`domain-${domainName.replace(/\s+/g, '-').toLowerCase()}`} className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-4">{domainName}</h2>
                        <div className="space-y-6">
                            {controls.map((item, index) => (
                                <EditableControlRow
                                    key={item.controlCode}
                                    item={item}
                                    onUpdateItem={onUpdateItem}
                                    isEditable={isEditable}
                                    canUpdate={canUpdate}
                                    index={domainStartIndex + index}
                                    isGenerating={generatingRecommendationFor === item.controlCode}
                                    activeField={activeControlCode === item.controlCode ? activeField : null}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
