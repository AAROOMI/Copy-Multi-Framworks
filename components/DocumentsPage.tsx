
import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { PolicyDocument, UserRole, DocumentStatus, Control, Subdomain, Domain, GeneratedContent, PrebuiltPolicyTemplate, User, Permission, CompanyProfile } from '../types';
import { eccData } from '../data/controls';
import { policyTemplates } from '../data/templates';
import { CheckIcon, CloseIcon, SparklesIcon, ShieldCheckIcon } from './Icons';

// Use declare to get libraries from the global scope (from script tags)
declare const jspdf: any;
declare const html2canvas: any;
declare const QRCode: any;
declare const JsBarcode: any;

// Helper to get status color
const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'Pending CISO Approval':
        case 'Pending CTO Approval':
        case 'Pending CIO Approval':
        case 'Pending CEO Approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};

const statusToRoleMap: Record<string, UserRole> = {
    'Pending CISO Approval': 'CISO',
    'Pending CTO Approval': 'CTO',
    'Pending CIO Approval': 'CIO',
    'Pending CEO Approval': 'CEO',
};

const roleApprovalOrder: UserRole[] = ['CISO', 'CTO', 'CIO', 'CEO'];

const renderMarkdown = (markdown: string) => {
    // This is a simplified markdown renderer
    let html = markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-normal mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-normal mt-6 mb-3">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-normal mt-8 mb-4">$1</h1>')
        .replace(/^\s*[-*] (.*$)/gim, '<li class="mb-1 ml-4">$1</li>')
        .replace(/<\/li><li/gim, '</li><li') // fix lists
        .replace(/\n/g, '<br/>');

    // Wrap list items in <ul>
    html = html.replace(/<li/gim, '<ul><li').replace(/<\/li><br\/><ul><li/gim, '</li><li').replace(/<\/li><br\/>/gim, '</li></ul><br/>');
    // Clean up any remaining list tags
    const listCount = (html.match(/<ul/g) || []).length;
    const endListCount = (html.match(/<\/ul/g) || []).length;
    if (listCount > endListCount) {
        html += '</ul>'.repeat(listCount - endListCount);
    }
    
    return `<div class="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">${html.replace(/<br\/><br\/>/g, '</p><p>').replace(/<br\/>/g, '')}</div>`;
};

interface DocumentHeaderProps {
  doc: PolicyDocument;
  company: CompanyProfile;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ doc, company }) => {
    const identifierData = useMemo(() => {
        for (const domain of eccData) {
            for (const subdomain of domain.subdomains) {
                const control = subdomain.controls.find(c => c.id === doc.controlId);
                if (control) {
                    return { domain, subdomain, control };
                }
            }
        }
        return null;
    }, [doc.controlId]);

    const controlIdentifier = useMemo(() => {
        if (!identifierData) return '';
        const { domain, subdomain, control } = identifierData;
        return `ECC://${domain.id}/${subdomain.id}/${control.id}`;
    }, [identifierData]);


    if (!identifierData && !doc.controlId.startsWith('REPORT-')) { // Allow reports to render without ECC data
        return null;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-700 space-y-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    {company.logo ? (
                        <img src={company.logo} alt={`${company.name} Logo`} className="h-20 w-20 object-contain" />
                    ) : (
                        <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                            <ShieldCheckIcon className="h-10 w-10" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-lg font-normal text-gray-900 dark:text-gray-100 tracking-tight">{company.name}</h2>
                        <p className="text-sm font-normal text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-1">Official Policy Document</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document ID</p>
                    <p className="text-sm font-mono font-normal text-gray-700 dark:text-gray-300">{doc.id.split('-').pop()}</p>
                </div>
            </div>
            {controlIdentifier && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div>
                            <h3 className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase">Control Identifier</h3>
                            <p className="text-sm font-mono font-normal text-gray-800 dark:text-gray-200">{controlIdentifier}</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase text-right">Version</h3>
                            <p className="text-sm font-mono font-normal text-gray-800 dark:text-gray-200 text-right">
                                {doc.versionHistory ? `1.${doc.versionHistory.length}` : '1.0'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DocumentVerificationFooter: React.FC<{ doc: PolicyDocument }> = ({ doc }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (typeof QRCode !== 'undefined') {
            // Generate QR Code with Document ID and Verification URL
            const verificationData = `DOC-ID:${doc.id}|CONTROL:${doc.controlId}|STATUS:${doc.status}|VERIFY:https://nca-ecc-navigator.web.app/verify/${doc.id}`;
            QRCode.toDataURL(verificationData, { width: 128, margin: 1, color: { dark: '#111827', light: '#ffffff00' } }, (err: any, url: string) => {
                if (!err) setQrCodeUrl(url);
            });
        }
        
        if (typeof JsBarcode !== 'undefined' && barcodeRef.current) {
            // Generate Barcode
            try {
                JsBarcode(barcodeRef.current, doc.controlId, {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 12,
                    height: 35,
                    margin: 0,
                    background: "transparent",
                    lineColor: "#374151" // dark gray
                });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [doc]);

    const getSignatureStatus = (role: UserRole) => {
        const approval = doc.approvalHistory.find(h => h.role === role && h.decision === 'Approved');
        if (approval) return { status: 'Signed', date: new Date(approval.timestamp).toLocaleDateString(), time: new Date(approval.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), signer: approval.role }; 
        
        const currentRoleIndex = roleApprovalOrder.indexOf(role);
        const currentStatusIndex = roleApprovalOrder.findIndex(r => `Pending ${r} Approval` === doc.status);
        
        // If Approved completely
        if (doc.status === 'Approved') return { status: 'Signed', date: new Date(doc.updatedAt).toLocaleDateString(), time: 'Automated', signer: 'System' };

        // Logic to determine if skipped/previous
        if (currentStatusIndex !== -1) {
            if (currentRoleIndex < currentStatusIndex) return { status: 'Signed', date: 'Pre-approved', time: '', signer: 'Previous' };
            if (currentRoleIndex === currentStatusIndex) return { status: 'Pending', date: '', time: '', signer: '' };
        }
        
        // If we are pending a role, roles after it are waiting
        if (doc.status.startsWith('Pending')) {
             const pendingRole = doc.status.replace('Pending ', '').replace(' Approval', '') as UserRole;
             const pendingIndex = roleApprovalOrder.indexOf(pendingRole);
             if (currentRoleIndex > pendingIndex) return { status: 'Waiting', date: '', time: '', signer: '' };
             if (currentRoleIndex < pendingIndex) return { status: 'Signed', date: 'Pre-approved', time: '', signer: 'Previous' };
        }

        return { status: 'Waiting', date: '', time: '', signer: '' };
    };

    return (
        <div className="mt-12 pt-8 border-t-4 border-double border-gray-300 dark:border-gray-600">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-normal text-gray-800 dark:text-gray-200 uppercase tracking-wide">Approval Chain</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-normal uppercase ${doc.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    Workflow Status: {doc.status === 'Approved' ? 'Complete' : 'In Progress'}
                </span>
            </div>
            
            <div className="flex flex-wrap justify-between gap-4 mb-10 relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 hidden sm:block transform -translate-y-1/2"></div>

                {roleApprovalOrder.map((role, index) => {
                    const sig = getSignatureStatus(role);
                    const isLast = index === roleApprovalOrder.length - 1;
                    let statusColor = 'border-gray-300 bg-white dark:bg-gray-800 text-gray-400';
                    let icon = <div className="w-3 h-3 rounded-full bg-gray-300"></div>;

                    if (sig.status === 'Signed') {
                        statusColor = 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 shadow-sm';
                        icon = <CheckIcon className="w-4 h-4 text-green-600" />;
                    } else if (sig.status === 'Pending') {
                        statusColor = 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-200 dark:ring-yellow-900';
                        icon = <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>;
                    }

                    return (
                        <div key={role} className={`flex-1 min-w-[140px] border-2 rounded-lg p-4 flex flex-col items-center text-center relative transition-all duration-300 ${statusColor}`}>
                            <div className="absolute -top-3 bg-white dark:bg-gray-800 px-2">
                                <span className="text-[10px] font-normal uppercase tracking-wider text-gray-500">{role}</span>
                            </div>
                            
                            <div className="my-3 flex-grow flex items-center justify-center">
                                {sig.status === 'Signed' ? (
                                    <div className="transform -rotate-6 border-2 border-green-600 dark:border-green-400 rounded px-2 py-1">
                                        <span className="font-serif text-lg text-green-700 dark:text-green-400 font-normal opacity-80">APPROVED</span>
                                    </div>
                                ) : sig.status === 'Pending' ? (
                                    <span className="text-xs font-normal bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100 px-2 py-1 rounded">PENDING</span>
                                ) : (
                                    <span className="text-xs italic text-gray-400">Waiting</span>
                                )}
                            </div>

                            <div className="w-full pt-2 border-t border-dashed border-gray-300 dark:border-gray-600 text-[10px]">
                                {sig.status === 'Signed' ? (
                                    <div className="flex flex-col">
                                        <span className="font-mono">{sig.date}</span>
                                        <span className="font-mono text-gray-500">{sig.time}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-300 dark:text-gray-600">--/--/----</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-teal-600 rounded-full"></div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-normal">Document Authentication</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Securely generated by NCA ECC Navigator</p>
                        </div>
                    </div>
                    
                    <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 inline-block">
                        <svg ref={barcodeRef} className="max-w-full h-10"></svg>
                    </div>
                    <p className="text-[10px] font-mono text-gray-400">{doc.controlId}-{doc.id}</p>
                </div>
                
                {qrCodeUrl && (
                    <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <img src={qrCodeUrl} alt="Verification QR Code" className="w-20 h-20" />
                        <div className="flex flex-col justify-center">
                            <p className="text-xs font-normal text-gray-800 dark:text-gray-200">SCAN TO VERIFY</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 max-w-[100px] leading-tight">
                                Use a secure scanner to validate document integrity.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// A dedicated component for clean, off-screen rendering for exports
const ExportableDocumentContent: React.FC<{ doc: PolicyDocument, company: CompanyProfile }> = ({ doc, company }) => {
    return (
        <div className="p-12 bg-white text-black font-sans min-h-[297mm] w-[210mm] relative mx-auto">
            <DocumentHeader doc={doc} company={company} />
            
            <div className="mb-10">
                <h1 className="text-lg font-normal mb-2 text-gray-900 uppercase tracking-tight">Policy Document</h1>
                <p className="text-sm text-gray-600 border-b-2 border-teal-600 pb-4 mb-6 inline-block pr-12">
                    {doc.domainName} <span className="text-teal-600 mx-2">/</span> {doc.subdomainTitle}
                </p>
                
                <h2 className="text-xl font-normal mt-8 mb-3 text-teal-800 uppercase border-b border-gray-200 pb-1">1. Policy Statement</h2>
                <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content.policy) }} />

                <h2 className="text-xl font-normal mt-8 mb-3 text-teal-800 uppercase border-b border-gray-200 pb-1">2. Procedures</h2>
                <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content.procedure) }} />

                <h2 className="text-xl font-normal mt-8 mb-3 text-teal-800 uppercase border-b border-gray-200 pb-1">3. Guidelines</h2>
                <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content.guideline) }} />
            </div>

            <div className="mt-auto">
                <DocumentVerificationFooter doc={doc} />
            </div>
        </div>
    );
};


interface DocumentDetailModalProps {
  doc: PolicyDocument;
  onClose: () => void;
  currentUser: User;
  onApprovalAction: (documentId: string, decision: 'Approved' | 'Rejected', comments?: string) => void;
  permissions: Set<Permission>;
  company: CompanyProfile;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ doc, onClose, currentUser, onApprovalAction, permissions, company }) => {
    const [activeTab, setActiveTab] = useState<'policy' | 'procedure' | 'guideline' | 'history'>('policy');
    const [viewingVersion, setViewingVersion] = useState<number | null>(null); // Index in versionHistory
    
    const canApprove = permissions.has('documents:approve');
    const isActionable = canApprove && statusToRoleMap[doc.status] === currentUser.role;
    const isPending = doc.status.startsWith('Pending');

    const displayedContent = viewingVersion !== null && doc.versionHistory && doc.versionHistory[viewingVersion]
        ? doc.versionHistory[viewingVersion].content
        : doc.content;

    const handleDecision = (decision: 'Approved' | 'Rejected') => {
        const promptMessage = decision === 'Approved'
            ? 'You are about to approve this document. Please provide any optional comments.'
            : 'You are about to reject this document. Please provide any optional comments.';
        const comments = prompt(promptMessage);

        if (comments !== null) {
            onApprovalAction(doc.id, decision, comments || undefined);
        }
    };

    const prepareExportableElement = (docToExport: PolicyDocument): Promise<HTMLElement> => {
        return new Promise((resolve) => {
            const exportContainer = document.createElement('div');
            // Style for off-screen rendering
            exportContainer.style.position = 'absolute';
            exportContainer.style.left = '-9999px';
            // exportContainer.style.width = '210mm'; // A4 width handled by component style
            document.body.appendChild(exportContainer);

            const root = ReactDOM.createRoot(exportContainer);
            root.render(<ExportableDocumentContent doc={docToExport} company={company} />);

            // Short delay to ensure all content (including canvas/QR/Barcodes) is rendered
            setTimeout(() => {
                resolve(exportContainer);
            }, 1000); // increased delay to ensure barcode render
        });
    };

    const cleanupExportableElement = (element: HTMLElement) => {
        // Unmount React component and remove the element from the DOM
        const root = (element as any)._reactRootContainer;
        if (root) {
            root.unmount();
        }
        document.body.removeChild(element);
    };

    const handleDownloadPDF = async () => {
        const exportElement = await prepareExportableElement(doc);
        if (!exportElement) return;

        const { jsPDF } = jspdf;
        const canvas = await html2canvas(exportElement.firstChild, { scale: 2, useCORS: true, logging: false });
        
        cleanupExportableElement(exportElement);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // If content fits on one page
        if (pdfHeight <= pdf.internal.pageSize.getHeight()) {
             pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        } else {
            // Multi-page handling (simplified split)
            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = -(pdfHeight - heightLeft); // Move image up
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }
        }

        pdf.save(`policy-${doc.controlId}.pdf`);
    };

    const handleDownloadWord = async () => {
        const exportElement = await prepareExportableElement(doc);
        if (!exportElement) return;
        
        // Convert canvas elements (QR/Barcode) to image data URIs
        const canvasElements = exportElement.querySelectorAll('canvas');
        canvasElements.forEach(canvas => {
            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            img.width = canvas.width / 2; 
            img.height = canvas.height / 2;
            canvas.parentNode?.replaceChild(img, canvas);
        });
        
        const htmlContent = exportElement.innerHTML;
        cleanupExportableElement(exportElement);

        try {
            const docHtml = `
              <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                    xmlns:w="urn:schemas-microsoft-com:office:word" 
                    xmlns="http://www.w3.org/TR/REC-html40">
              <head>
                <meta charset="utf-8">
                <title>Policy ${doc.controlId}</title>
                <!--[if gte mso 9]>
                <xml>
                  <w:WordDocument>
                    <w:View>Print</w:View>
                    <w:Zoom>100</w:Zoom>
                    <w:DoNotOptimizeForBrowser/>
                  </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                  body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 1in;
                  }
                  h1 { font-size: 24pt; color: #0d9488; font-weight: normal; margin-bottom: 12pt; }
                  h2 { font-size: 18pt; color: #0f172a; font-weight: normal; margin-top: 18pt; margin-bottom: 6pt; }
                  h3 { font-size: 14pt; color: #1e293b; font-weight: normal; margin-top: 14pt; margin-bottom: 4pt; }
                  p, li { font-size: 11pt; margin-bottom: 6pt; }
                  table { width: 100%; border-collapse: collapse; margin-top: 12pt; margin-bottom: 12pt; }
                  th, td { border: 1px solid #cbd5e1; padding: 8pt; text-align: left; font-size: 10pt; }
                  th { background-color: #f1f5f9; font-weight: bold; }
                </style>
              </head>
              <body>
                ${htmlContent}
              </body>
              </html>
            `;

            const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `policy-${doc.controlId}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error generating Word file:', error);
            alert('An error occurred while generating the Word document.');
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 shrink-0">
                    <div className="flex items-center gap-x-4 sm:gap-x-6">
                        <div>
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wider">Control</span>
                            <p className="text-lg font-normal text-gray-900 dark:text-gray-100 font-mono">{doc.controlId}</p>
                        </div>
                        <div className="h-10 border-l border-gray-200 dark:border-gray-600"></div>
                        <div>
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</span>
                            <p className={`mt-1 px-2.5 py-0.5 inline-flex text-sm leading-5 font-normal rounded-full ${getStatusColor(doc.status)}`}>
                                {doc.status}
                            </p>
                        </div>
                        {viewingVersion !== null && (
                            <span className="ml-4 px-3 py-1 text-xs font-normal rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 animate-pulse">
                                Viewing Past Version
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-x-4">
                        <div className="text-right hidden sm:block">
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wider">Path</span>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{doc.domainName} &gt; {doc.subdomainTitle}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <CloseIcon className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8 bg-gray-100 dark:bg-gray-900">
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 max-w-4xl mx-auto border border-gray-200 dark:border-gray-700">
                        <DocumentHeader doc={doc} company={company} />
                        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {['policy', 'procedure', 'guideline'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm transition-colors ${activeTab === tab ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm transition-colors ${activeTab === 'history' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}
                                >
                                    Version History
                                </button>
                            </nav>
                        </div>
                        
                        {activeTab === 'history' ? (
                            <div className="space-y-4">
                                <h3 className="text-lg font-normal text-gray-900 dark:text-gray-100 mb-4">Document Version History</h3>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wider">Generated By</th>
                                                <th className="px-6 py-3 text-right text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {/* Current Version */}
                                            <tr className={viewingVersion === null ? 'bg-teal-50 dark:bg-teal-900/20' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {new Date(doc.updatedAt).toLocaleString()} <span className="ml-2 text-xs text-teal-600 font-normal">(Current)</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {doc.generatedBy || 'System'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-normal">
                                                    <button 
                                                        onClick={() => setViewingVersion(null)}
                                                        className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200"
                                                        disabled={viewingVersion === null}
                                                    >
                                                        {viewingVersion === null ? 'Viewing' : 'View'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* Past Versions */}
                                            {doc.versionHistory?.slice().reverse().map((version, index) => {
                                                const originalIndex = (doc.versionHistory!.length - 1) - index;
                                                return (
                                                    <tr key={version.versionId} className={viewingVersion === originalIndex ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {new Date(version.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {version.generatedBy}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-normal">
                                                            <button 
                                                                onClick={() => { setViewingVersion(originalIndex); setActiveTab('policy'); }}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 p-6 rounded-lg bg-gray-50 dark:bg-gray-900/30 min-h-[300px]">
                               <div dangerouslySetInnerHTML={{ __html: renderMarkdown(displayedContent[activeTab]) }} />
                            </div>
                        )}
                        
                        {activeTab !== 'history' && <DocumentVerificationFooter doc={doc} />}
                    </div>
                </main>
                <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-3">
                      <button onClick={handleDownloadPDF} className="flex items-center gap-2 text-sm font-normal text-white bg-gray-800 hover:bg-gray-900 py-2 px-4 rounded-md shadow-sm transition-colors">
                        Download PDF
                      </button>
                      <button onClick={handleDownloadWord} className="flex items-center gap-2 text-sm font-normal text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 py-2 px-4 rounded-md shadow-sm transition-colors">
                        Download Word
                      </button>
                    </div>
                    {isPending && isActionable && viewingVersion === null && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDecision('Rejected')}
                                className="px-6 py-2 border border-red-300 text-sm font-normal rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                title="Reject this document"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleDecision('Approved')}
                                className="px-6 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                                title="Approve this document"
                            >
                                Approve & Sign
                            </button>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

const TemplatesView: React.FC<{
    onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent) => void;
    permissions: Set<Permission>;
}> = ({ onAddDocument, permissions }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<PrebuiltPolicyTemplate | null>(null);
    const [selectedControl, setSelectedControl] = useState<string>('');
    const [previewTab, setPreviewTab] = useState<'policy' | 'procedure' | 'guideline'>('policy');
    const canApplyTemplate = permissions.has('templates:apply');

    const allControls = useMemo(() => eccData.flatMap(domain => domain.subdomains.flatMap(subdomain => subdomain.controls.map(control => ({...control, subdomain, domain})))), []);
    
    useEffect(() => {
        if (selectedTemplate) {
            setPreviewTab('policy');
        }
    }, [selectedTemplate]);

    const handleUseTemplate = () => {
        if (selectedTemplate && selectedControl) {
            const controlData = allControls.find(c => c.id === selectedControl);
            if(controlData) {
                onAddDocument(controlData, controlData.subdomain, controlData.domain, selectedTemplate.content);
                alert(`Template '${selectedTemplate.title}' applied to control ${selectedControl} and sent for approval.`);
                setSelectedControl('');
                setSelectedTemplate(null);
            }
        }
    };
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                <h3 className="font-normal text-lg text-gray-800 dark:text-gray-200">Policy Templates</h3>
                {policyTemplates.map(template => (
                    <button key={template.id} onClick={() => setSelectedTemplate(template)} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${selectedTemplate?.id === template.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/50' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                        <h4 className="font-normal text-gray-900 dark:text-gray-100">{template.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                    </button>
                ))}
            </div>
            {selectedTemplate && (
                 <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 self-start">
                    <div>
                        <h3 className="font-normal text-lg text-gray-800 dark:text-gray-200">Apply Template: <span className="text-teal-600 dark:text-teal-400">{selectedTemplate.title}</span></h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Select a control to apply this policy template to. This will create a new document and start the approval process.</p>
                        <div className="space-y-4">
                            <label htmlFor="control-select" className="block text-sm font-normal text-gray-700 dark:text-gray-300">Target Control</label>
                            <select 
                                id="control-select" 
                                value={selectedControl} 
                                onChange={(e) => setSelectedControl(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-teal-500 dark:focus:border-teal-500"
                            >
                                <option value="">-- Select a Control --</option>
                                {allControls.map(c => <option key={c.id} value={c.id}>{c.id}: {c.description.substring(0, 80)}...</option>)}
                            </select>
                            {canApplyTemplate ? (
                                <button 
                                    onClick={handleUseTemplate} 
                                    disabled={!selectedControl}
                                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Use This Template
                                </button>
                            ) : (
                                <div className="p-3 text-center bg-gray-100 dark:bg-gray-700/50 rounded-md">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        You do not have permission to apply templates.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-normal text-lg text-gray-800 dark:text-gray-200 mb-4">Template Preview</h4>
                        <div className="border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
                            <div className="border-b border-gray-200 dark:border-gray-600">
                                <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                                    <button
                                        onClick={() => setPreviewTab('policy')}
                                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-normal text-sm ${previewTab === 'policy' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}
                                    >
                                        Policy
                                    </button>
                                    <button
                                        onClick={() => setPreviewTab('procedure')}
                                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-normal text-sm ${previewTab === 'procedure' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}
                                    >
                                        Procedure
                                    </button>
                                    <button
                                        onClick={() => setPreviewTab('guideline')}
                                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-normal text-sm ${previewTab === 'guideline' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}
                                    >
                                        Guideline
                                    </button>
                                </nav>
                            </div>
                            <div className="p-4 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 rounded-b-md">
                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedTemplate.content[previewTab]) }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


interface DocumentsPageProps {
  repository: PolicyDocument[];
  currentUser: User;
  onApprovalAction: (documentId: string, decision: 'Approved' | 'Rejected', comments?: string) => void;
  onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent) => void;
  permissions: Set<Permission>;
  company: CompanyProfile;
  initialOpenDocId?: string; // New prop for auto-opening a doc
  onClearInitialDoc?: () => void; // New prop to clear the ID in parent
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ repository, currentUser, onApprovalAction, onAddDocument, permissions, company, initialOpenDocId, onClearInitialDoc }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'all' | 'templates'>('tasks');
  const [selectedDoc, setSelectedDoc] = useState<PolicyDocument | null>(null);

  const myTasks = useMemo(() => 
    repository.filter(doc => statusToRoleMap[doc.status] === currentUser.role),
    [repository, currentUser]
  );
  
  const sortedRepo = useMemo(() => 
    [...repository].sort((a, b) => b.updatedAt - a.updatedAt),
    [repository]
  );

  // Auto-open document effect
  useEffect(() => {
      if (initialOpenDocId) {
          const doc = repository.find(d => d.id === initialOpenDocId);
          if (doc) {
              setSelectedDoc(doc);
              // Switch to 'all' tab if it's not in my tasks to ensure context is clear, though modal overlays everything
              if (!statusToRoleMap[doc.status] || statusToRoleMap[doc.status] !== currentUser.role) {
                  setActiveTab('all');
              }
              if (onClearInitialDoc) {
                  onClearInitialDoc();
              }
          }
      }
  }, [initialOpenDocId, repository, currentUser.role, onClearInitialDoc]);

  const renderTable = (docs: PolicyDocument[]) => (
    <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full">
            <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Control</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-normal text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                       {docs.map(doc => (
                           <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                               <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="flex items-center gap-2">
                                    <span className="text-sm font-normal text-gray-900 dark:text-gray-100">{doc.controlId}</span>
                                    {doc.generatedBy === 'AI Agent' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                            <SparklesIcon className="w-3 h-3" />
                                            AI-Generated
                                        </span>
                                    )}
                                   </div>
                                   <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{doc.controlDescription}</div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="flex items-center space-x-2">
                                       <span className={`px-2 inline-flex text-xs leading-5 font-normal rounded-full ${getStatusColor(doc.status)}`}>
                                           {doc.status}
                                       </span>
                                       {doc.status.startsWith('Pending') && statusToRoleMap[doc.status] && (
                                           <div className="flex items-center text-xs text-gray-500 dark:text-gray-400" title={`Waiting for ${statusToRoleMap[doc.status]} approval`}>
                                               <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                                               <span className="font-normal">{statusToRoleMap[doc.status]}</span>
                                           </div>
                                       )}
                                   </div>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-normal">
                                   <button onClick={() => setSelectedDoc(doc)} className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-200">View</button>
                               </td>
                           </tr>
                       ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-normal text-gray-800 dark:text-gray-100 tracking-tight">Document Management</h1>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Review, approve, and manage all cybersecurity policy documents.</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('tasks')} className={`relative whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm ${activeTab === 'tasks' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                My Tasks
                {myTasks.length > 0 && <span className="ml-2 absolute top-3 -right-4 inline-flex items-center justify-center px-2 py-1 text-xs font-normal leading-none text-red-100 bg-red-600 rounded-full">{myTasks.length}</span>}
            </button>
            <button onClick={() => setActiveTab('all')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm ${activeTab === 'all' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>All Documents</button>
            {permissions.has('templates:read') && (
                <button onClick={() => setActiveTab('templates')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-normal text-sm ${activeTab === 'templates' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>Templates</button>
            )}
        </nav>
      </div>

      <div>
        {activeTab === 'tasks' && (myTasks.length > 0 ? renderTable(myTasks) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">You have no pending tasks.</p>)}
        {activeTab === 'all' && (sortedRepo.length > 0 ? renderTable(sortedRepo) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">No documents have been generated yet.</p>)}
        {activeTab === 'templates' && <TemplatesView onAddDocument={onAddDocument} permissions={permissions} />}
      </div>
      
      {selectedDoc && <DocumentDetailModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} currentUser={currentUser} onApprovalAction={onApprovalAction} permissions={permissions} company={company} />}
    </div>
  );
};
