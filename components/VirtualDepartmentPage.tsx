
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { AIService } from '../services/aiService';
import { virtualAgents } from '../data/virtualAgents';
import type { OrganizationSize, VirtualAgent, Risk, PolicyDocument, AssessmentItem, AuditAction } from '../types';
import { UserGroupIcon, ShieldCheckIcon, SparklesIcon, MicrophoneIcon, ChatBotIcon, UploadIcon, PaperClipIcon, CloseIcon, DocumentTextIcon, EyeIcon } from './Icons';
import { collection, doc, setDoc, addDoc, getDocs, query, orderBy, limit, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Play, Square, Bell, Check, Key, Smartphone, FileText, Settings, Wifi, WifiOff, Users, Database, Globe, RefreshCw, Volume2, ArrowRight, ShieldCheck, HelpCircle, Terminal, Phone, Mail, CheckCircle, Video, Zap
} from 'lucide-react';
import { CNNEvidenceLab } from './CNNEvidenceLab';
import { MemoryVault } from './MemoryVault';
import { DevOpsDocs } from './DevOpsDocs';
import { CodeReviewPanel } from './CodeReviewPanel';
import { CybersecuritySkills } from './CybersecuritySkills';
import { SolaceAgentMesh } from './SolaceAgentMesh';

interface VirtualDepartmentPageProps {
    onDelegateTask: (agentName: string, task: string) => void;
    onConsultAgent: (agent: VirtualAgent) => void;
    risks?: Risk[];
    documents?: PolicyDocument[];
    eccAssessment?: AssessmentItem[];
    pdplAssessment?: AssessmentItem[];
    onAddDocument?: (doc: PolicyDocument) => void;
    onAddRisk?: (risk: Risk) => void;
    onAddAuditLog?: (action: AuditAction, details: string) => void;
    auditLog?: any[];
    language?: 'en' | 'ar';
}

const DialogueDialogueEntry = null; // Removing the old ai constant

// Define the simulated dialogue entry
interface DialogueEntry {
    speaker: string;
    message_en: string;
    message_ar: string;
    message_ur?: string;
    message_de?: string;
    message_zh?: string;
    action?: string; 
    timestamp: number;
    attachment?: { name: string, type: string };
}

// Browser Speech Recognition Types
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export const VirtualDepartmentPage: React.FC<VirtualDepartmentPageProps> = ({ 
    onDelegateTask, 
    onConsultAgent,
    risks = [],
    documents = [],
    eccAssessment = [],
    pdplAssessment = [],
    onAddDocument,
    onAddRisk,
    onAddAuditLog,
    auditLog = [],
    language = 'en'
}) => {

    const [isLiveMode, setIsLiveMode] = useState(false);
    const [orgSize, setOrgSize] = useState<OrganizationSize>('Mid-Market');
    const [selectedAgent, setSelectedAgent] = useState<VirtualAgent | null>(null);
    const [agentTaskInput, setAgentTaskInput] = useState('');
    const [isRecordingTaskVoice, setIsRecordingTaskVoice] = useState(false);
    const taskRecognitionRef = useRef<any>(null);

    const startTaskVoiceRecording = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = true;
            rec.lang = language === 'ar' ? 'ar-SA' : 'en-US';

            rec.onstart = () => {
                setIsRecordingTaskVoice(true);
            };

            rec.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setAgentTaskInput(transcript);
            };

            rec.onerror = (event: any) => {
                console.error('Task speech recognition error', event.error);
                setIsRecordingTaskVoice(false);
            };

            rec.onend = () => {
                setIsRecordingTaskVoice(false);
            };

            taskRecognitionRef.current = rec;
            rec.start();
        } else {
            alert('Speech Recognition is not supported in this browser.');
        }
    };

    const stopTaskVoiceRecording = () => {
        if (taskRecognitionRef.current) {
            taskRecognitionRef.current.stop();
        }
        setIsRecordingTaskVoice(false);
    };

    const toggleMicrophoneTaskDelegation = () => {
        if (isRecordingTaskVoice) {
            stopTaskVoiceRecording();
        } else {
            startTaskVoiceRecording();
        }
    };

    // --- High Fidelity Dynamic Layout State Managers ---
    const [activeTab, setActiveTab] = useState<'boardroom' | 'approvals' | 'vault' | 'docs' | 'code'>('boardroom');
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    
    // Continuous Voice Command Log
    const [voiceNavLog, setVoiceNavLog] = useState<string[]>([]);
    const [voiceNavActive, setVoiceNavActive] = useState(false);
    
    // Shared past memory boardroom states mapping directly with Firebase
    const [pastMeetings, setPastMeetings] = useState<any[]>([]);
    const [lastMeetingMOM, setLastMeetingMOM] = useState<string>('');
    const [isSavingSession, setIsSavingSession] = useState(false);

    // Dynamic Voice Config Console parameters to ensure natural vocals & custom overrides
    const [agentVoiceConfig, setAgentVoiceConfig] = useState<Record<string, { pitch: number, rate: number, volume: number, voiceKeyword: string }>>({
        'Ahmed Al-Mansoori': { pitch: 0.82, rate: 0.88, volume: 1.0, voiceKeyword: 'male' },
        'Fahad': { pitch: 0.95, rate: 0.98, volume: 1.0, voiceKeyword: 'male' },
        'Mohammed': { pitch: 1.0, rate: 0.92, volume: 1.0, voiceKeyword: 'male' },
        'Ibrahim': { pitch: 0.88, rate: 0.94, volume: 1.0, voiceKeyword: 'male' },
        'Asaad': { pitch: 1.02, rate: 0.96, volume: 1.0, voiceKeyword: 'male' },
        'Abdullah': { pitch: 0.96, rate: 0.94, volume: 1.0, voiceKeyword: 'male' },
        'Rashid': { pitch: 0.85, rate: 0.92, volume: 1.0, voiceKeyword: 'male' }
    });

    // Human-in-the-loop Pending Approval list
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([
        {
            id: 'app-1',
            title: 'SAMA Cryptographic Key Management Procedure',
            docType: 'Procedure Policy Draft',
            assignedAgent: 'Asaad AI',
            status: 'Pending Verification',
            framework: 'SAMA CSF Sec 3.2.14',
            fileMockName: 'sama_crypto_v1.2.pdf',
            size: '524 KB',
            content: 'This cryptographic policy defines key management lifecycle under SAMA alignment. All HSM modules must be FIPS 140-3 compliant. Key renewal cycle set to 90 days with asymmetric escrow backup.',
            cnnResult: null
        },
        {
            id: 'app-2',
            title: 'NCA ECC Logical Access Control Policy',
            docType: 'Security Standard Policy',
            assignedAgent: 'Fahad AI',
            status: 'Pending Verification',
            framework: 'NCA ECC-1:2018 (Logical Security)',
            fileMockName: 'nca_ecc_passwords_v2.pdf',
            size: '340 KB',
            content: 'Password history limit set to 24 previous generations. Mandatory MFA enabled for all enterprise assets. Root administrator credentials locked inside a split-knowledge digital vault.',
            cnnResult: null
        },
        {
            id: 'app-3',
            title: 'Physical Security & Asset Controls Playbook',
            docType: 'Compliance Asset Policy',
            assignedAgent: 'Abdullah AI',
            status: 'Approved',
            framework: 'NCA ECC Physical Security Mandates',
            fileMockName: 'physical_audit_evidence.png',
            size: '1.2 MB',
            content: 'CCTV surveillance layout configured for datacenter perimeters. Entry restricted using dual-factor biometric barriers with detailed entry/exit ledger persistence.',
            cnnResult: {
                matchPercent: 98.7,
                activationHeatmap: [0.99, 0.98, 0.97, 0.95],
                classification: 'Valid NCA Compliance Evidence'
            }
        }
    ]);

    // CNN Computer Vision process States
    const [isCnnProcessing, setIsCnnProcessing] = useState(false);
    const [activeCnnItem, setActiveCnnItem] = useState<string | null>(null);
    const [cnnStatusText, setCnnStatusText] = useState('');
    const [cnnLayerOutput, setCnnLayerOutput] = useState<string[]>([]);
    const [cnnModelConfidence, setCnnModelConfidence] = useState(0);

    // Dynamic Notifications & Meeting Alert State (Initiating human meetings)
    const [meetingNotification, setMeetingNotification] = useState<any>(null);
    const [showContactModal, setShowContactModal] = useState<any>(null);
    const [commLedger, setCommLedger] = useState<any[]>([
        { id: 1, timestamp: Date.now() - 3600000, recipient: 'Ahmed Al-Mansoori (CISO)', channel: 'Email', details: 'Automated briefing dispatched for NCA ECC 90% implementation targets.' }
    ]);

    // Code Viewer State
    const [selectedCodePath, setSelectedCodePath] = useState<string>('firebase.ts');
    const [customCodeComments, setCustomCodeComments] = useState<string[]>([]);

    // User Manual Narrator State
    const [narratedParagraph, setNarratedParagraph] = useState<number | null>(null);

    // Sync connectivity status & Firestore meetings list
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Sync Initial database history
        const fetchMinutesOfMeeting = async () => {
            try {
                const q = query(collection(db, 'meetings'), orderBy('createdAt', 'desc'), limit(15));
                const snap = await getDocs(q);
                const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPastMeetings(items);
                if (items.length > 0) {
                    setLastMeetingMOM((items[0] as any).momContent || '');
                }
            } catch (err) {
                console.warn("Could not sync boardroom logs directly with GCP Firebase, launching offline cache fallback.", err);
                const localCache = localStorage.getItem('boardroom_mom_history');
                if (localCache) {
                    const parsed = JSON.parse(localCache);
                    setPastMeetings(parsed);
                    if (parsed.length > 0) {
                        setLastMeetingMOM(parsed[0].momContent || '');
                    }
                }
            }
        };

        fetchMinutesOfMeeting();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isLiveMode]);

    // Simulated external check to trigger board meeting notifications
    useEffect(() => {
        const trigger = setTimeout(() => {
            setMeetingNotification({
                id: 'notif-grc-emergency',
                sender: 'Ahmed Al-Mansoori (CISO)',
                message: 'Strategic Review Pending: SAMA audit flags our cryptographic key lifecycle. Requesting instant boardroom alignment.',
                urgency: 'high'
            });
        }, 8000);
        return () => clearTimeout(trigger);
    }, []);

    // Load active file code viewer annotations
    useEffect(() => {
        let comments = [];
        if (selectedCodePath === 'firebase.ts') {
            comments = [
                "Ahmed Al-Mansoori (CISO): 'No critical service parameters or raw credentials leaked to browser bundles. Setup is proxies-ready.'",
                "Ibrahim (Auditor): 'Audit logs confirm Firebase Auth correctly manages token refreshes under secure cookies constraints.'",
                "Asaad (DPO): 'Perfect. Satisfies SAMA CSF cryptographic standard controls.'"
            ];
        } else if (selectedCodePath === 'db.ts') {
            comments = [
                "Fahad (CTO): 'Client-side calls use cleanObject to eliminate undefined mutations. Robust offline safety is fully integrated.'",
                "Asaad (DPO): 'Data schemas separate company records to comply with regional data residency guidelines.'"
            ];
        } else if (selectedCodePath === 'Dockerfile') {
            comments = [
                "Fahad (CTO): 'Engineered multi-stage optimization blocks. Nginx serves minimized SPA files efficiently on port 3000.'",
                "Ahmed Al-Mansoori (CISO): 'Verified. Restricting ports protects the internal microservices ecosystem from outside scanners.'"
            ];
        } else if (selectedCodePath === 'server.ts') {
            comments = [
                "Fahad (CTO): 'Express server routes /api/* calls directly and leverages Vite SPA middleware strictly in dev mode.'",
                "Ahmed Al-Mansoori (CISO): 'Unified structure hosts server-side Gemini generation without exposing confidential keys.'"
            ];
        } else {
            comments = [
                "Ibrahim (Auditor): 'Standard structural architecture verified. No telemetry elements or unsolicited indicators noted.'"
            ];
        }
        setCustomCodeComments(comments);
    }, [selectedCodePath]);

    interface DelegatedTask {
        id: string;
        title: string;
        description: string;
        assignedAgent: string;
        assignedRole: string;
        raciStatus: 'Responsible' | 'Accountable' | 'Consulted' | 'Informed';
        status: 'To Do' | 'In Progress' | 'Done';
        progress: number;
        createdAt: number;
        completedAt?: number;
        outputs?: {
            type: 'policy' | 'risk' | 'audit';
            id: string;
            name: string;
        }[];
    }

    const [delegatedTasks, setDelegatedTasks] = useState<DelegatedTask[]>(() => {
        const saved = localStorage.getItem('grc_delegated_tasks');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        return [
            {
                id: 'task-1',
                title: 'Develop Privilege Access Management Policy',
                description: 'Draft the formal operational boundary policy for high-privilege users in accordance with SAMA CSF 3.1.2 and NCA ECC-1-2.',
                assignedAgent: 'Fahad AI',
                assignedRole: 'CTO',
                raciStatus: 'Responsible',
                status: 'To Do',
                progress: 0,
                createdAt: Date.now() - 172800000,
            },
            {
                id: 'task-2',
                title: 'Formulate Business Continuity Incident Playbook',
                description: 'Write a comprehensive disaster recovery step-by-step playbook under SAMA CSF 3.5.3.',
                assignedAgent: 'Ahmed AI',
                assignedRole: 'CISO',
                raciStatus: 'Accountable',
                status: 'To Do',
                progress: 0,
                createdAt: Date.now() - 86400000,
            },
            {
                id: 'task-3',
                title: 'Conduct SAMA CSF Multi-Cloud Security Assessment',
                description: 'Evaluate physical and virtual cloud boundaries for compliance and list key vulnerabilities.',
                assignedAgent: 'Rashid AI',
                assignedRole: 'Risk Manager',
                raciStatus: 'Responsible',
                status: 'To Do',
                progress: 0,
                createdAt: Date.now() - 43200000,
            }
        ];
    });

    useEffect(() => {
        localStorage.setItem('grc_delegated_tasks', JSON.stringify(delegatedTasks));
    }, [delegatedTasks]);

    const [activeWorkingTaskId, setActiveWorkingTaskId] = useState<string | null>(null);
    const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

    const getOfflineSimDialogue = (userContext?: string, analysisContext?: string, eccComp?: number, risksCount?: number) => {
        const textLower = (userContext || "").toLowerCase();
        if (textLower.includes("policy") || textLower.includes("document") || textLower.includes("procedure")) {
            return [
                {
                    speaker: "Ahmed Al-Mansoori",
                    message_en: "Regarding the policy drafting request: As CISO, I hold the ultimate accountability for our documentation structure under SAMA and NCA regulations. Asaad, let's expedite this draft.",
                    message_ar: "بخصوص طلب صياغة السياسات: بصفتي مسؤول أمن المعلومات، أتحمل المسؤولية الكاملة عن هيكل وثائقنا بموجب لوائح مؤسسة النقد العربي السعودي وهيئة الأمن السيبراني. أسعد، دعنا نسرع في هذه المسودة.",
                    message_ur: "پالیسی ڈرافٹنگ کی درخواست کے بارے میں: بطور سی آئی ایس او، میرے پاس SAMA اور NCA قوانین کے تحت ہماری دستاویزات کی آخری ذمہ داری ہے۔ اسعد، آئیے اس ڈرافٹ کو تیزی سے اگے بڑھائیں۔",
                    message_de: "Bezüglich der Richtlinienerstellung: Als CISO trage ich die ultimative Verantwortung für unsere Dokumentationsstruktur gemäß SAMA- und NCA-Vorschriften. Asaad, lassen Sie uns diesen Entwurf beschleunigen.",
                    message_zh: "关于政策草拟要求：作为首席信息安全官(CISO)，我对SAMA和NCA法规下的文档结构承担最终责任。Asaad，让我们加快这个草案的编写。"
                },
                {
                    speaker: "Asaad AI",
                    message_en: "Absolutely, Ahmed. SAMA CSF requirements dictate formal policy approvals. I've initiated a compliant draft targeting these missing domains.",
                    message_ar: "بالتأكيد يا أحمد. تتطلب متعلبات SAMA CSF موافقات رسمية على السياسات. لقد بدأت مسودة متوافقة تستهدف هذه المجالات المفقودة.",
                    message_ur: "بالکل، احمد۔ SAMA CSF کے تقاضے پالیسیوں کی باقاعدہ منظوری کا کہتے ہیں۔ میں نے ان غائب ڈومینز کے لئے ایک تعمیل والا ڈرافٹ شروع کیا ہے۔",
                    message_de: "Absolut, Ahmed. Die SAMA-CSF-Anforderungen verlangen formelle Richtliniengenehmigungen. Ich habe einen konformen Entwurf gestartet, der auf diese fehlenden Domänen abzielt.",
                    message_zh: "完全同意，Ahmed。SAMA CSF的要求规定了正式的政策批准。我已经启动了一个针对这些缺失领域的合规草案。"
                },
                {
                    speaker: "Fahad AI",
                    message_en: "Excellent. I will review the technical architecture controls within the document once Asaad finishes the primary draft.",
                    message_ar: "ممتاز. سأراجع ضوابط الهندسة التقنية داخل المستند بمجرد أن ينتهي أسعد من المسودة الأساسية.",
                    message_ur: "بہت اچھا۔ اسعد کے بنیادی ڈرافٹ کو ختم کرنے کے بعد میں دستاویز کے اندر سیکیورٹی اور ٹیکنالوجی کنٹرولز کا جائزہ لوں گا۔",
                    message_de: "Hervorragend. Ich werde die technischen Architekturkontrollen im Dokument überprüfen, sobald Asaad den ersten Entwurf fertigstellt.",
                    message_zh: "太好了。在Asaad完成初稿后，我将审查文档里的技术架构控制措施。"
                }
            ];
        }
        if (textLower.includes("risk") || textLower.includes("assess") || textLower.includes("mitigate")) {
            return [
                {
                    speaker: "Ahmed Al-Mansoori",
                    message_en: "We are monitoring the risks closely. Our ISO 31000 methodology identifies key security threats. We should focus on our active risk treatment plans.",
                    message_ar: "نحن نراقب المخاطر عن كثب. تحدد منهجية ISO 31000 الخاصة بنا التهديدات الأمنية الرئيسية. يجب أن نركز على خطط معالجة المخاطر النشطة لدينا.",
                    message_ur: "ہم خطرات کی قریب سے نگرانی کر رہے ہیں۔ ہماری ISO 31000 طریقہ کار اہم سیکورٹی خطرات کی نشاندہی کرتا ہے۔ ہمیں اپنے فعال علاج کے منصوبوں پر توجہ دینی چاہیے۔",
                    message_de: "Wir überwachen die Risiken genau. Unsere ISO 31000-Methodik identifiziert die wichtigsten Sicherheitsbedrohungen. Wir sollten sich auf unsere aktiven Risikobehandlungspläne konzentrieren.",
                    message_zh: "我们正在密切监控风险。我们的ISO 31000方法论识别了关键的安全威胁。我们应该专注于现有的风险处理计划。"
                },
                {
                    speaker: "Ahmed Al-Mansoori",
                    message_en: "Agree. Every high-risk entry must have concrete control owners. Fahad, ensure technology backups are fully tested.",
                    message_ar: "موافق. يجب أن يكون لكل مدخل عالي المخاطر مالكو ضوابط ملموسة. فهد، تأكد من اختبار النسخ الاحتياطية التقنية بالكامل.",
                    message_ur: "متفق ہوں۔ ہر ہائی رسک انٹری کے پاس ٹھوس کنٹرول مالکان ہونے چاہئیں۔ فہد، یقینی بنائیں کہ ٹیکنالوجی بیک اپ کا مکمل تجربہ کیا گیا ہے۔",
                    message_de: "Einverstanden. Jeder risikoreiche Eintrag muss konkrete Kontrolleigentümer haben. Fahad, stellen Sie sicher, dass Technologie-Backups vollständig getestet sind.",
                    message_zh: "同意。每一个高风险项都必须有具体的控制负责人。Fahad，确保技术备份得到了完整测试。"
                },
                {
                    speaker: "Fahad AI",
                    message_en: "Understood, Ahmed. We are preparing localized operational recovery drills to demonstrate mitigation efficacy.",
                    message_ar: "مفهوم يا أحمد. نحن نجهز تدريبات استرداد تشغيلية محلية لإثبات فعالية التخفيف.",
                    message_ur: "سمجھ گیا، احمد۔ ہم فعال تخفیف کی افادیت کو ظاہر کرنے کے لیے مقامی آپریشنل ریکوری مشقیں تیار کر رہے ہیں۔",
                    message_de: "Verstanden, Ahmed. Wir bereiten lokalisierte betriebliche Wiederherstellungsübungen vor, um die Wirksamkeit der Risikominderung zu demonstrieren.",
                    message_zh: "明白，Ahmed。我们正在筹备本地化的业务恢复演练，以证明风险缓解措施的效果。"
                }
            ];
        }
        return [
            {
                speaker: "Ahmed Al-Mansoori",
                message_en: `Welcome to the GRC boardroom database. We are operating with a current compliance score of ${eccComp || 0}%. Let's discuss our immediate priorities.`,
                message_ar: `مرحبًا بكم في قاعدة بيانات قاعة اجتماعات الحوكمة والمخاطر والامتثال. نحن نعمل بنسبة امتثال تبلغ ${eccComp || 0}٪ حاليًا. دعونا نناقش أولوياتنا الفورية.`,
                message_ur: `جی آر سی بورڈ روم ڈیٹا بیس میں خوش آمدید۔ ہم فی الحال ${eccComp || 0}٪ کے تعمیل اسکور کے ساتھ کام کر رہے ہیں۔ آئیے اپنی فوری ترجیحات پر بات کریں۔`,
                message_de: `Willkommen in der GRC-Vorstandsdatenbank. Wir arbeiten derzeit mit einem Compliance-Wert von ${eccComp || 0}%. Lassen Sie uns unsere unmittelbaren Prioritäten besprechen.`,
                message_zh: `欢迎来到GRC董事会数据库。我们目前以 ${eccComp || 0}% 的合规得分运行。让我们讨论一下我们眼前的首要任务。`
            },
            {
                speaker: "Fahad AI",
                message_en: "As Chief Technology Officer, I'm auditing our endpoints to address any technical configuration gaps immediately.",
                message_ar: "بصفتي كبير مسؤولي التكنولوجيا، أقوم بمراجعة نقاط النهاية لدينا لمعالجة أي ثغرات في التكوين الفني على الفور.",
                message_ur: "بطور چیف ٹیکنالوجی آفیسر، میں سیکیورٹی گیپس کو فوری طور پر دور کرنے کے لیے ہمارے اینڈ پوائنٹس کا آڈٹ کر رہا ہوں۔",
                message_de: "Als Chief Technology Officer überprüfe ich unsere Endpunkte, um eventuelle Lücken in der technischen Konfiguration sofort zu beheben.",
                message_zh: "作为首席技术官，我正在审计端点，以便立即解决任何技术配置上的漏洞。"
            },
            {
                speaker: "Abdullah AI",
                message_en: "Our continuous AI auditors are ready to evaluate the implementation evidence. Please upload screenshots for validation.",
                message_ar: "مدققو الذكاء الاصطناعي المستمرون لدينا مستعدون لتقييم أدلة التنفيذ. يرجى تحميل لقطات الشاشة للتحقق من صحتها.",
                message_ur: "ہمارے مسلسل اے آئی آڈٹرز عمل درآمد کے ثبوت کا جائزہ لینے کے لیے تیار ہیں۔ تصدیق کے لیے براہ کرم اسکرین شاٹس اپ لوڈ کریں۔",
                message_de: "Unsere kontinuierlichen KI-Auditoren sind bereit, die Implementierungsnachweise zu bewerten. Bitte laden Sie Screenshots zur Validierung hoch.",
                message_zh: "我们的持续AI审计员已准备好评估实施证据。请上传截图进行验证。"
            }
        ];
    };

    const simulateTaskProgress = async (taskId: string) => {
        const task = delegatedTasks.find(t => t.id === taskId);
        if (!task || activeWorkingTaskId) return;

        setActiveWorkingTaskId(taskId);
        setSimulationLogs([`Initializing agentic execution thread for ${task.assignedAgent}...`]);

        const updateTask = (updates: Partial<DelegatedTask>) => {
            setDelegatedTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
        };

        updateTask({ status: 'In Progress', progress: 15 });

        await new Promise(r => setTimeout(r, 1000));
        setSimulationLogs(prev => [...prev, `${task.assignedAgent} loaded RACI configuration [Role: ${task.assignedRole} - Status: ${task.raciStatus}].`]);
        updateTask({ progress: 35 });

        await new Promise(r => setTimeout(r, 1200));
        setSimulationLogs(prev => [...prev, `${task.assignedAgent} is accessing enterprise GRC compliance models (NCA ECC & SAMA CSF)...`]);
        updateTask({ progress: 60 });

        let artifactDetails = "";
        try {
            const isPolicyString = task.title.toLowerCase().includes("policy") || task.description.toLowerCase().includes("policy") || task.title.toLowerCase().includes("incident") || task.description.toLowerCase().includes("incident") || task.title.toLowerCase().includes("playbook") || task.description.toLowerCase().includes("playbook") || task.title.toLowerCase().includes("procedure") || task.description.toLowerCase().includes("procedure");
            const isRiskString = task.title.toLowerCase().includes("risk") || task.description.toLowerCase().includes("risk") || task.title.toLowerCase().includes("vulnerab") || task.description.toLowerCase().includes("vulnerab") || task.title.toLowerCase().includes("threat") || task.description.toLowerCase().includes("threat");

            if (isPolicyString && onAddDocument) {
                let policyText = "";
                if (window.navigator.onLine) {
                    try {
                        policyText = await AIService.generateContent(`Draft a robust professional Cybersecurity GRC policy content based on: "${task.title} - ${task.description}". Format with nice headers and sections.`);
                    } catch {
                        policyText = `# ${task.title}\n\n## 1. Objective\nThis document defines corporate governance guidelines drafted offline by ${task.assignedAgent}.\n\n## 2. Scope\nApplies to all enterprise assets and employees.\n\n## 3. Operational Requirements\n1. Ensure controls are monitored continuously.\n2. Report gaps to the CISO.`;
                    }
                } else {
                    policyText = `# ${task.title}\n\n## 1. Objective\nThis document defines corporate governance guidelines drafted offline by ${task.assignedAgent}.\n\n## 2. Scope\nApplies to all enterprise assets and employees.\n\n## 3. Operational Requirements\n1. Ensure controls are monitored continuously.\n2. Report gaps to the CISO.`;
                }

                const docId = `doc-del-${Date.now()}`;
                const newDoc: PolicyDocument = {
                    id: docId,
                    controlId: `DEP-${Date.now().toString().slice(-4)}`,
                    domainName: 'Governance & Alignment',
                    subdomainTitle: 'Agentic Mandates',
                    controlDescription: `Auto-generated from delegated task: ${task.title}`,
                    status: 'Pending CISO Approval',
                    content: {
                        policy: policyText,
                        procedure: "Drafted and awaiting review",
                        guideline: "Standard execution guideline"
                    },
                    approvalHistory: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    generatedBy: 'AI Agent'
                };
                onAddDocument(newDoc);
                artifactDetails = `Generated GRC Document [${newDoc.controlId}: ${newDoc.controlDescription.slice(0, 30)}...]`;
                updateTask({
                    outputs: [{ type: 'policy', id: docId, name: task.title }]
                });
            } else if (isRiskString && onAddRisk) {
                const riskId = `risk-del-${Date.now()}`;
                const newRisk: Risk = {
                    id: riskId,
                    title: task.title,
                    description: task.description,
                    category: 'Operational Technology',
                    owner: task.assignedAgent,
                    inherentLikelihood: 4, inherentImpact: 4, inherentScore: 16,
                    existingControl: 'Internal Reviews', controlEffectiveness: 'Needs Improvement',
                    residualLikelihood: 3, residualImpact: 3, residualScore: 9,
                    likelihood: 3, impact: 3,
                    treatmentOption: 'Mitigate', mitigation: 'Automated policy enforcement.', responsibility: task.assignedRole,
                    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
                    acceptanceCriteria: 'Satisfactory evidence logs', approvedBy: 'Ahmed Al-Mansoori', remarks: 'Generated via delegated task'
                };
                onAddRisk(newRisk);
                artifactDetails = `Logged Risk Register Entry [${newRisk.title}]`;
                updateTask({
                    outputs: [{ type: 'risk', id: riskId, name: task.title }]
                });
            } else {
                if (onAddAuditLog) {
                    onAddAuditLog('AGENTIC_AUDIT_COMPLETED', `Delegated task validated by ${task.assignedAgent}: ${task.title}`);
                }
                artifactDetails = `Verified evidence log added to System Audit Ledger.`;
            }

            setSimulationLogs(prev => [...prev, `Success: ${artifactDetails}`]);

        } catch (e) {
            console.error(e);
            setSimulationLogs(prev => [...prev, "Simulation generated minor metadata warnings, proceeding to write-back..."]);
        }

        updateTask({ progress: 90 });
        await new Promise(r => setTimeout(r, 1000));

        updateTask({ status: 'Done', progress: 100, completedAt: Date.now() });
        setSimulationLogs(prev => [...prev, `Task successfully completed by ${task.assignedAgent}! Systems connected.`]);
        
        if (onAddAuditLog) {
            onAddAuditLog('VIRTUAL_DEPT_ACTION', `Completed task: "${task.title}" by ${task.assignedAgent}`);
        }

        setTimeout(() => {
            setActiveWorkingTaskId(null);
            setSimulationLogs([]);
        }, 3000);
    };

    // Live Collaboration State
    const [boardroomLang, setBoardroomLang] = useState<'en' | 'ar' | 'ur' | 'de' | 'zh'>('en');
    const [meetingLog, setMeetingLog] = useState<DialogueEntry[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    // Voice & Simulation Interruption States
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const activeSimulationIdRef = useRef<number>(0);

    // Dynamic Voice Loader
    useEffect(() => {
        const loadVoices = () => {
            if ('speechSynthesis' in window) {
                setAvailableVoices(window.speechSynthesis.getVoices());
            }
        };
        loadVoices();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);
    
    // Voice & Input State
    const [isMicActive, setIsMicActive] = useState(false);
    const [userSpeechInput, setUserSpeechInput] = useState('');
    const recognitionRef = useRef<any>(null);
    
    // Document Upload for Meeting
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedFile, setUploadedFile] = useState<{name: string, data: string, type: string} | null>(null);
    const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Collaboration Feed logs filtered from core audit Log (with normal fonts)
    const collaborationLogs = (auditLog || []).filter(entry => 
        entry.action === 'VIRTUAL_DEPT_ACTION' ||
        entry.action === 'AGENTIC_AUDIT_COMPLETED' ||
        String(entry.details || '').toLowerCase().includes('task') ||
        String(entry.details || '').toLowerCase().includes('delegate') ||
        String(entry.details || '').toLowerCase().includes('agent') ||
        ['Ahmed', 'Fahad', 'Mohammed', 'Ibrahim', 'Asaad', 'Abdullah', 'Rashid'].some(name => String(entry.details || '').includes(name))
    );

    // Scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [meetingLog, isThinking]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
                setVoiceNavLog(prev => [transcript, ...prev].slice(0, 5));
                
                // Continuous Voice Command Parser
                if (transcript.includes('navigate to approvals') || transcript.includes('open approvals') || transcript.includes('open vision lab')) {
                    setActiveTab('approvals');
                    speakLine("Navigating to Pending Approvals and CNN Vision Evidence Laboratory", "System");
                    return;
                }
                if (transcript.includes('navigate to boardroom') || transcript.includes('open boardroom') || transcript.includes('open meeting')) {
                    setActiveTab('boardroom');
                    speakLine("Opening Boardroom live dialogue terminal", "System");
                    return;
                }
                if (transcript.includes('navigate to memory') || transcript.includes('open memory') || transcript.includes('open vault') || transcript.includes('open archives')) {
                    setActiveTab('vault');
                    speakLine("Accessing Shared Corporate Memory Vault", "System");
                    return;
                }
                if (transcript.includes('navigate to manual') || transcript.includes('open manual') || transcript.includes('open guides') || transcript.includes('open devops')) {
                    setActiveTab('docs');
                    speakLine("Launching User Manual and DevOps Setup guides", "System");
                    return;
                }
                if (transcript.includes('navigate to code') || transcript.includes('open code reviewer') || transcript.includes('open code')) {
                    setActiveTab('code');
                    speakLine("Directing to Agentic Code Inspection panel", "System");
                    return;
                }
                if (transcript.includes('consult ahmed') || transcript.includes('talk to ahmed')) {
                    const ahmed = virtualAgents.find(a => a.name.includes("Ahmed"));
                    if (ahmed) {
                        setSelectedAgent(ahmed);
                        speakLine("Displaying profile for CISO Ahmed Al Mansoori", "System");
                    }
                    return;
                }
                if (transcript.includes('consult fahad') || transcript.includes('talk to fahad')) {
                    const fahad = virtualAgents.find(a => a.name.includes("Fahad"));
                    if (fahad) {
                        setSelectedAgent(fahad);
                        speakLine("Displaying profile for CTO Fahad", "System");
                    }
                    return;
                }
                if (transcript.includes('close profile') || transcript.includes('close agent')) {
                    setSelectedAgent(null);
                    speakLine("Closing agent bio panel", "System");
                    return;
                }
                if (transcript.includes('start collaboration') || transcript.includes('start meeting')) {
                    setIsLiveMode(true);
                    setMeetingLog([]);
                    runSimulationTurn();
                    speakLine("Staging emergency strategic board meeting", "System");
                    return;
                }
                if (transcript.includes('end meeting') || transcript.includes('stop boardroom')) {
                    generateMOM();
                    speakLine("Closing boardroom and generating Minutes of Meeting", "System");
                    return;
                }

                // If not navigation, route as dialogue input
                setUserSpeechInput(transcript);
                setIsMicActive(false);
                handleUserSpeak(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsMicActive(false);
            };
            
            recognitionRef.current.onend = () => {
                if (voiceNavActive) {
                    try { recognitionRef.current.start(); } catch(e) {}
                } else {
                    setIsMicActive(false);
                }
            }
        }
    }, [voiceNavActive]);

    const toggleVoiceNav = () => {
        if (voiceNavActive) {
            recognitionRef.current?.stop();
            setVoiceNavActive(false);
            setIsMicActive(false);
        } else {
            setVoiceNavActive(true);
            setIsMicActive(true);
            try {
                recognitionRef.current?.start();
            } catch (err) {
                console.warn("Speech session active or not supported:", err);
            }
        }
    };

    const toggleMic = () => {
        if (isMicActive) {
            recognitionRef.current?.stop();
            setIsMicActive(false);
        } else {
            recognitionRef.current?.start();
            setIsMicActive(true);
        }
    };

    // Text-to-Speech Helper
    const speakLine = (line: Partial<DialogueEntry> | string, speaker: string) => {
        if (!('speechSynthesis' in window)) return;
        
        // Cancel previous speech to avoid overlap
        window.speechSynthesis.cancel();

        let text = "";
        let speakingLang = 'en';

        if (typeof line === 'string') {
            text = line;
        } else {
            // Read based on boardroomLang selection
            if (boardroomLang === 'ar') {
                text = line.message_ar || line.message_en || "";
                speakingLang = 'ar';
            } else if (boardroomLang === 'ur') {
                text = line.message_ur || line.message_en || "";
                speakingLang = 'ur';
            } else if (boardroomLang === 'de') {
                text = line.message_de || line.message_en || "";
                speakingLang = 'de';
            } else if (boardroomLang === 'zh') {
                text = line.message_zh || line.message_en || "";
                speakingLang = 'zh';
            } else {
                text = line.message_en || "";
                speakingLang = 'en';
            }
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voicesList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
        
        // Comprehensive natural voice selection targeting selected language and human gender
        const getBestVoice = () => {
            const keywords: Record<string, string[]> = {
                ar: ['arabic', 'ar', 'maged', 'tarik', 'microsoft naayf', 'male'],
                ur: ['urdu', 'ur', 'microsoft asif', 'male'],
                de: ['deutsch', 'german', 'de', 'stefan', 'male'],
                zh: ['chinese', 'mandarin', 'zh', 'huihui', 'kangkang', 'male'],
                en: ['google us english male', 'natural male', 'premium male', 'guy', 'david', 'mark', 'george', 'richard', 'andrew', 'microsoft david', 'male']
            };
            const currentKeywords = keywords[speakingLang] || ['en'];
            
            for (const keyword of currentKeywords) {
                const voice = voicesList.find(v => v.name.toLowerCase().includes(keyword) && v.lang.toLowerCase().startsWith(speakingLang));
                if (voice) return voice;
            }
            
            const anyLangMatch = voicesList.find(v => v.lang.toLowerCase().startsWith(speakingLang));
            if (anyLangMatch) return anyLangMatch;
            
            return voicesList.find(v => v.lang.toLowerCase().startsWith('en'));
        };

        const selectedVoice = getBestVoice();
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        }

        // Match config parameters to make each male spokesperson sound distinct but completely natural & human (never robotic)
        const agentKey = Object.keys(agentVoiceConfig).find(k => speaker.includes(k)) || "Abdullah";
        const cfg = agentVoiceConfig[agentKey] || { pitch: 0.95, rate: 0.95, volume: 1.0 };
        utterance.pitch = cfg.pitch;
        utterance.rate = cfg.rate;
        utterance.volume = cfg.volume;
        
        window.speechSynthesis.speak(utterance);
    };

    const handleUserSpeak = async (text: string) => {
        // Interrupt current active runs immediately
        activeSimulationIdRef.current += 1;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // Add user entry immediately
        const userEntry: DialogueEntry = {
            speaker: "You (User)",
            message_en: text,
            message_ar: "...", // Placeholder
            timestamp: Date.now()
        };
        setMeetingLog(prev => [...prev, userEntry]);
        
        // Trigger agents to respond to this
        await runSimulationTurn(text);
    };

    // --- Simulation Logic ---

    // Optimized JSON extractor
    const extractJson = (text: string) => {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? jsonMatch[0] : text;
    };

    const runSimulationTurn = async (userContext?: string, analysisContext?: string) => {
        setIsThinking(true);
        const currentRunId = ++activeSimulationIdRef.current;

        try {
            if (meetingLog.length === 0 && !userContext && !analysisContext) {
                const initialLine: DialogueEntry = {
                    speaker: "Ahmed Al-Mansoori",
                    message_en: "We are compliance to zero percent. We have a clean state with none of our controls implemented yet. Let's start working on the missing pieces of our cybersecurity puzzle to begin building it. How should we proceed?",
                    message_ar: "نحن في حالة امتثال بنسبة صفر بالمائة. لدينا لوحة نظيفة تمامًا ولم نقم بتطبيق ضوابط بعد. لنبدأ في معالجة القطع المفقودة لخطتنا الأمنية لنبدأ بالبناء والامتثال. كيف تريد منا أن نبدأ؟",
                    message_ur: "ہماری تعمیل زیرو فیصد پر ہے۔ ابھی ہمارا ایک بھی کنٹرول لاگو نہیں ہوا ہے۔ آئیے اپنے سائبر سیکیورٹی کے غائب ٹکڑوں پر کام شروع کریں تاکہ اسے تعمیر کیا جا سکے۔ ہمیں کیسے آگے بڑھنا چاہئے؟",
                    message_de: "Wir sind bei null Prozent Compliance. Wir haben einen sauberen Zustand, da noch keine unserer Kontrollen implementiert wurden. Fangen wir an, an den fehlenden Teilen unseres Cybersecurity-Rätsels zu arbeiten. Wie sollen wir vorgehen?",
                    message_zh: "我们的合规进度为零百分比。我们处于一个没有任何安全控制措施实施的状态。让我们开始着手解决网络安全中缺失的部分，并开始构建合规体系。请问我们应该如何进行？",
                    timestamp: Date.now()
                };
                speakLine(initialLine, initialLine.speaker);
                setMeetingLog([initialLine]);
                setIsThinking(false);
                return;
            }

            // 1. Calculate Context
            const eccCompliance = Math.round((eccAssessment.filter(i => i.controlStatus === 'Implemented').length / (eccAssessment.length || 1)) * 100);
            const criticalRisks = risks.filter(r => (r.residualScore || 0) > 15).length;

            // 2. Build Dialogue Transcript history
            const historyText = meetingLog.length === 0 
                ? `First turn. Note: The Minutes of Meeting (MOM) from our previous workspace session: "${lastMeetingMOM || 'None loaded yet'}"` 
                : meetingLog.slice(-8).map(log => `${log.speaker}: "${log.message_en}"${log.action ? ` [Triggered: ${log.action}]` : ''}`).join("\n");

            let specificInstruction = "Discuss the lowest compliance areas and devise a GRC strategy.";
            if (userContext) {
                specificInstruction = `The user asked or said: "${userContext}". Respond immediately and professionally to the user's input, answering their questions relative to the current GRC status.`;
            } else if (analysisContext) {
                specificInstruction = `A document has been analyzed: "${analysisContext}". Discuss findings.`;
            }

            const systemInstruction = `
            You are the "Director" orchestrating a virtual cybersecurity department with 6 AI agents:
            1. Ahmed Al-Mansoori (CISO) - Authoritative, highly strategic.
            2. Fahad (CTO) - Rapid-fire, technical, focuses on implementation.
            3. Mohammed (CIO) - Structured, values governance and timelines.
            4. Ibrahim (Auditor) - Objective, demanding evidence, pragmatic.
            5. Asaad (DPO) - Sensitive to privacy, classification, and PDPL controls.
            6. Abdullah (Operations) - Ground-level, focuses on assets and practical workflows.

            **Context State:**
            - NCA ECC Compliance progress: ${eccCompliance}%
            - Critical Risks outstanding: ${criticalRisks}

            **Previous Discussion History (Transcript of last 8 lines):**
            ${historyText}

            **Task:**
            Generate a short, natural simulated dialogue (exactly 1 to 3 turns maximum) where the agents react directly to the prompt without ANY repetition. 

            **Language Mandate:**
            Provide high-fidelity translations for EVERY turn in the following five active formats:
            - message_en: English content (strategic, consultant-grade)
            - message_ar: Arabic translation
            - message_ur: Urdu translation
            - message_de: German translation
            - message_zh: Chinese translation

            **Consultation Rules:**
            - DO NOT repeat introductory scripts, greetings, or things already expressed in the transcript.
            - Answer the user's input directly, clearly, and concisely as GRC experts.
            - Provide highly professional, mature, consultant-grade feedback.
            - Make the agents sound collaborative, talking directly to each other or back-and-forth to resolve the user's question.

            **Output Format:**
            JSON ARRAY of objects:
            [{ "speaker": "Ahmed Al-Mansoori" | "Fahad" | "Mohammed" | "Ibrahim" | "Asaad" | "Abdullah", "message_en": "English response", "message_ar": "Arabic translation", "message_ur": "Urdu translation", "message_de": "German translation", "message_zh": "Chinese translation", "action": { "type": "create_doc" | "assess_risk", "title": "...", "category": "..." } || null }]
            `;

            let script: any[] = [];
            try {
                const scriptResponse = await AIService.generateContent(specificInstruction, {
                    model: 'gemini-2.0-flash',
                    systemInstruction: systemInstruction,
                });

                if (activeSimulationIdRef.current !== currentRunId) return; // Interrupted!
                script = JSON.parse(extractJson(scriptResponse) || '[]');
            } catch (err) {
                console.warn("AI Generation failed. Operating in offline/fallback mode.", err);
                script = getOfflineSimDialogue(userContext || specificInstruction, undefined, eccCompliance, criticalRisks);
            }

            // Process script line-by-line with custom interruption sleep checking
            for (const line of script) {
                if (activeSimulationIdRef.current !== currentRunId) {
                    console.log("SIMULATION INTERRUPTED - Terminating older dialog thread.");
                    break;
                }

                // Speak the line with appropriate language selection
                speakLine(line, line.speaker);

                const entry: DialogueEntry = {
                    speaker: line.speaker,
                    message_en: line.message_en,
                    message_ar: line.message_ar,
                    message_ur: line.message_ur || "",
                    message_de: line.message_de || "",
                    message_zh: line.message_zh || "",
                    timestamp: Date.now()
                };

                // Execute Side Effects
                if (line.action) {
                     if (line.action.type === 'create_doc' || (line.action.title && !line.action.category)) {
                        if (onAddDocument) {
                            const newDoc: PolicyDocument = {
                                id: `doc-sim-${Date.now()}`,
                                controlId: `SIM-${Date.now().toString().slice(-4)}`,
                                domainName: 'Simulated Domain',
                                subdomainTitle: 'Live Collaboration',
                                controlDescription: `Auto-generated: ${line.action.title}`,
                                status: 'Pending CISO Approval',
                                content: { policy: `# ${line.action.title}\n\nGenerated during live meeting.`, procedure: "TBD", guideline: "TBD" },
                                approvalHistory: [],
                                createdAt: Date.now(),
                                updatedAt: Date.now(),
                                generatedBy: 'AI Agent'
                            };
                            onAddDocument(newDoc);
                            entry.action = `Created Document: ${line.action.title}`;
                        }
                    } else if (line.action.type === 'assess_risk' || line.action.category) {
                        if (onAddRisk) {
                            const newRisk: Risk = {
                                id: `risk-sim-${Date.now()}`,
                                title: line.action.title,
                                description: "Identified during live collaboration session.",
                                category: line.action.category || 'General',
                                owner: line.speaker,
                                inherentLikelihood: 3, inherentImpact: 3, inherentScore: 9,
                                existingControl: 'None', controlEffectiveness: 'Ineffective',
                                residualLikelihood: 3, residualImpact: 3, residualScore: 9,
                                likelihood: 3, impact: 3,
                                treatmentOption: 'Mitigate', mitigation: 'Develop control.', responsibility: 'IT',
                                dueDate: '', acceptanceCriteria: '', approvedBy: '', remarks: ''
                            };
                            onAddRisk(newRisk);
                            entry.action = `Logged Risk: ${line.action.title}`;
                        }
                    }
                }

                setMeetingLog(prev => [...prev, entry]);

                // Interval Sleep checking for active simulation token every 100ms
                const textDuration = Math.max(1800, line.message_en.length * 55);
                let elapsed = 0;
                while (elapsed < textDuration) {
                    if (activeSimulationIdRef.current !== currentRunId) {
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                    elapsed += 100;
                }

                if (activeSimulationIdRef.current !== currentRunId) {
                    break;
                }
            }

        } catch (e) {
            console.error("Simulation failed", e);
        } finally {
            if (activeSimulationIdRef.current === currentRunId) {
                setIsThinking(false);
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const base64 = loadEvent.target?.result as string;
                setUploadedFile({
                    name: file.name,
                    data: base64.split(',')[1], // Strip prefix
                    type: file.type
                });
                // Auto-trigger analysis
                analyzeDocument(base64.split(',')[1], file.type);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeDocument = async (base64Data: string, mimeType: string) => {
        setIsAnalyzingDoc(true);
        
        // Add "Upload" entry to chat
        const uploadEntry: DialogueEntry = {
            speaker: "You (User)",
            message_en: "I have uploaded a document for review.",
            message_ar: "لقد قمت بتحميل مستند للمراجعة.",
            timestamp: Date.now(),
            attachment: { name: fileInputRef.current?.files?.[0]?.name || "Document", type: "file" }
        };
        setMeetingLog(prev => [...prev, uploadEntry]);

        try {
            // Use Gemini Vision to analyze
            const prompt = `
            You are the collective intelligence of a GRC Department. 
            Analyze this uploaded document image/pdf.
            
            1. Identify what type of document this is (e.g., New Regulation, Audit Evidence, Policy Draft).
            2. If it is a New Regulation/Framework: Identify key requirements and gaps.
            3. If it is Evidence: Validate if it meets typical security controls (firewall rules, logs, etc.).
            
            Provide a concise summary of the analysis to be fed into the meeting simulation.
            `;

            const analysisResult = await AIService.generateContent(prompt, {
                model: 'gemini-2.0-flash',
                image: { data: base64Data, mimeType: mimeType || 'image/png' }
            });
            
            // Feed this context into the simulation loop
            await runSimulationTurn(undefined, analysisResult);

        } catch (err) {
            console.error("Vision analysis failed", err);
            const errorEntry: DialogueEntry = {
                speaker: "System",
                message_en: "Failed to analyze document. Please ensure it is a valid image or PDF.",
                message_ar: "فشل تحليل المستند.",
                timestamp: Date.now()
            };
            setMeetingLog(prev => [...prev, errorEntry]);
        } finally {
            setIsAnalyzingDoc(false);
            setUploadedFile(null);
        }
    };

    const generateMOM = async () => {
        if (meetingLog.length === 0) return;
        setIsSavingSession(true);
        const logText = meetingLog.map(entry => `${entry.speaker}: ${entry.message_en} ${entry.action ? `[Action: ${entry.action}]` : ''}`).join('\n');
        
        try {
            const momContent = await AIService.generateContent(`Generate a formal Minutes of Meeting (MOM) document based on this transcript:\n\n${logText}\n\nInclude: Date, Attendees (Agents & User), Key Discussion Points, Decisions Made, and Action Items. Format as Markdown.`);
            
            // Sync with Firebase Firestore always connected as backend
            const meetingData = {
                title: `GRC Boardroom Alignment Session - ${new Date().toLocaleDateString()}`,
                momContent: momContent,
                transcript: meetingLog.map(log => ({
                    speaker: log.speaker,
                    message_en: log.message_en,
                    message_ar: log.message_ar || '',
                    timestamp: log.timestamp
                })),
                createdAt: Date.now(),
                complianceDelta: 5 // Simulated increase
            };

            try {
                // Save new meeting report to firestore meetings collection
                await addDoc(collection(db, 'meetings'), meetingData);
                // Update latest workspace boardroom session state doc
                await setDoc(doc(db, 'companies', 'demo-company', 'grc_boardroom', 'latest_session'), {
                    latestMOM: momContent,
                    timestamp: Date.now()
                }, { merge: true });
            } catch (firestoreErr) {
                console.warn("Direct Firestore storage timed out or was blocked. Saving to local storage repository.", firestoreErr);
            }

            // Always update offline cache persistence
            const cachedMinutes = localStorage.getItem('boardroom_mom_history');
            const parsedMinutes = cachedMinutes ? JSON.parse(cachedMinutes) : [];
            const updatedMinutes = [meetingData, ...parsedMinutes].slice(0, 15);
            localStorage.setItem('boardroom_mom_history', JSON.stringify(updatedMinutes));
            localStorage.setItem('last_meeting_mom', momContent);
            setLastMeetingMOM(momContent);

            if (onAddDocument) {
                const momDoc: PolicyDocument = {
                    id: `mom-${Date.now()}`,
                    controlId: `MOM-${new Date().toISOString().slice(0,10)}`,
                    domainName: 'Governance',
                    subdomainTitle: 'Meeting Records',
                    controlDescription: 'Minutes of Meeting - Live Collaboration Session',
                    status: 'Approved',
                    content: {
                        policy: momContent,
                        procedure: "N/A",
                        guideline: "Distributed to Management"
                    },
                    approvalHistory: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    generatedBy: 'AI Agent'
                };
                onAddDocument(momDoc);
                alert("Minutes of Meeting successfully compiled and backed up in Firestore as persistent Memory.");
            }
            
            setIsLiveMode(false); // End meeting
            
        } catch (e) {
            console.error("MOM Gen failed", e);
        } finally {
            setIsSavingSession(false);
        }
    };

    const handleDelegate = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAgent && agentTaskInput.trim()) {
            let raci: 'Responsible' | 'Accountable' | 'Consulted' | 'Informed' = 'Responsible';
            if (selectedAgent.role === 'CISO') {
                raci = 'Accountable';
            } else if (selectedAgent.role === 'CIO') {
                raci = 'Consulted';
            }
            
            const newTask: DelegatedTask = {
                id: `task-${Date.now()}`,
                title: agentTaskInput.trim().slice(0, 60) + (agentTaskInput.trim().length > 60 ? '...' : ''),
                description: agentTaskInput.trim(),
                assignedAgent: selectedAgent.name,
                assignedRole: selectedAgent.role,
                raciStatus: raci,
                status: 'To Do',
                progress: 0,
                createdAt: Date.now()
            };

            setDelegatedTasks(prev => [newTask, ...prev]);

            if (onAddAuditLog) {
                onAddAuditLog('VIRTUAL_DEPT_ACTION', `Delegated task to ${selectedAgent.name}: "${newTask.title}"`);
            }

            onDelegateTask(selectedAgent.name, agentTaskInput);
            setAgentTaskInput('');
            setSelectedAgent(null);
            alert(`Task successfully delegated to ${selectedAgent.name} with responsibility level: [${raci}]. It has been embedded in the agent's workflow board.`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Critical Stakeholder Meeting Request Notification Alert Banner */}
            {meetingNotification && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <Bell className="w-5 h-5 text-amber-600 animate-bounce" id="bell_alert_icon" />
                        <div>
                            <p className="text-xs font-medium text-amber-900">
                                Boardroom Request from {meetingNotification.sender}
                            </p>
                            <p className="text-[11px] text-amber-700 mt-0.5 font-normal">
                                {meetingNotification.message}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            onClick={() => {
                                setMeetingNotification(null);
                                setActiveTab('boardroom');
                                setIsLiveMode(true);
                                setMeetingLog([]);
                                runSimulationTurn();
                                speakLine("Emergency Boardroom sequence initiated by Stakeholder request", "System");
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs transition-all font-normal"
                            id="accept_emerg_btn"
                        >
                            Accept & Join Session
                        </button>
                        <button
                            onClick={() => setMeetingNotification(null)}
                            className="px-2 py-1 bg-white hover:bg-gray-100 text-amber-800 border border-amber-350 rounded text-xs transition-all font-normal"
                            id="dismiss_emerg_btn"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Title & Organization Size Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 dark:border-gray-800 pb-4">
                <div>
                     <h1 className="text-md font-normal text-gray-905 dark:text-white flex items-center gap-2 select-none" id="main_title">
                         <UserGroupIcon className="w-5 h-5 text-teal-600" />
                         Virtual GRC & Cybersecurity Department Cockpit
                     </h1>
                     <p className="mt-1 text-xs text-gray-500 font-normal">
                         Strategic boardroom alignments, SAMA/NCA evidence reviews, memory recall, and deployment setups.
                     </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] px-2 py-1 bg-teal-50 dark:bg-teal-950/45 text-teal-600 dark:text-teal-400 border border-teal-250 rounded font-normal font-mono">
                        <Database className="w-3.5 h-3.5" />
                        <span>Firestore Synced</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded text-xs font-normal">
                        <span className="text-gray-400">Org Size:</span>
                        <select 
                            value={orgSize} 
                            onChange={(e) => setOrgSize(e.target.value as OrganizationSize)}
                            className="bg-transparent border-none text-gray-900 dark:text-white font-normal p-0 outline-none cursor-pointer"
                        >
                            <option value="Startup">Startup (10-50)</option>
                            <option value="Mid-Market">Mid-Market (100-500)</option>
                            <option value="Enterprise">Enterprise (1000+)</option>
                        </select>
                    </div>

                    <button 
                        onClick={toggleVoiceNav}
                        className={`flex items-center gap-1.5 border border-gray-255 dark:border-gray-750 px-3 py-1 rounded text-xs font-mono transition-all ${voiceNavActive ? 'bg-green-50/45 text-green-700 border-green-300' : 'bg-transparent text-gray-400 hover:text-gray-700'}`}
                        id="toggle_voice_nav_btn"
                    >
                        <MicrophoneIcon className={`w-3.5 h-3.5 ${voiceNavActive ? 'animate-pulse' : ''}`} />
                        <span>Voice Controls: {voiceNavActive ? 'Listening' : 'Off'}</span>
                    </button>
                    
                    {/* Manual Dial Agents triggers */}
                    <div className="flex gap-1">
                        {virtualAgents.slice(0, 3).map(ag => (
                            <button
                                key={ag.name}
                                onClick={() => {
                                    setSelectedAgent(ag);
                                    setShowContactModal({ type: 'WhatsApp', agent: ag });
                                }}
                                className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-0.5 border border-emerald-250 rounded font-normal"
                            >
                                WhatsApp {ag.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Header Bar (Normal Fonts) */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 gap-1.5 overflow-x-auto select-none" id="grc_tabs_header">
                {[
                    { id: 'boardroom', label: 'Executive Boardroom & GRC Live', icon: Users },
                    { id: 'solace', label: 'Solace EventMesh AI Orchestration', icon: Zap },
                    { id: 'skills', label: 'Cybersecurity Skills Intelligence', icon: ShieldCheck },
                    { id: 'approvals', label: 'Pending Approvals & CNN Vision Lab', icon: ShieldCheck },
                    { id: 'vault', label: 'Corporate Memory Vault', icon: Database },
                    { id: 'docs', label: 'Docker & Windows Setup Manual', icon: FileText },
                    { id: 'code', label: 'Agentic Code Inspector', icon: Terminal }
                ].map(t => {
                    const isActive = activeTab === t.id;
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`py-2 px-4 text-xs font-normal transition-all flex items-center gap-1.5 border-b-2 -mb-px outline-none ${
                                isActive 
                                    ? 'border-teal-500 text-teal-650 dark:text-teal-400 font-normal bg-teal-50/5' 
                                    : 'border-transparent text-gray-500 hover:text-gray-750 dark:text-gray-400 hover:border-gray-300'
                            }`}
                            id={`tab_nav_${t.id}`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Continuous Voice command feedback alert when navigation takes place */}
            {voiceNavActive && voiceNavLog.length > 0 && (
                <div className="bg-gray-900 border border-gray-750 p-2 px-3.5 rounded text-[11px] font-mono text-zinc-400 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1">
                        <Terminal className="text-teal-500 w-3.5 h-3.5" />
                        Listening for Voice Commands...
                    </span>
                    <span className="text-teal-400 font-semibold">Processed: "{voiceNavLog[0]}"</span>
                </div>
            )}

            {/* Render selected view content */}
            {activeTab === 'solace' && (
                <SolaceAgentMesh />
            )}

            {activeTab === 'skills' && (
                <CybersecuritySkills />
            )}

            {activeTab === 'approvals' && (
                <CNNEvidenceLab 
                    pendingApprovals={pendingApprovals}
                    onApprove={(id) => {
                        setPendingApprovals(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
                        alert('Control document verified and logged to SAMA compliant ledger.');
                    }}
                    onUpdateCNNResult={(id, res) => {
                        setPendingApprovals(prev => prev.map(p => p.id === id ? { ...p, cnnResult: res } : p));
                    }}
                />
            )}

            {activeTab === 'vault' && (
                <MemoryVault 
                    pastMeetings={pastMeetings}
                    lastMeetingMOM={lastMeetingMOM}
                    isSavingSession={isSavingSession}
                    isOnline={isOnline}
                    onRefreshHistory={async () => {
                        try {
                            const q = query(collection(db, 'meetings'), orderBy('createdAt', 'desc'), limit(15));
                            const snap = await getDocs(q);
                            setPastMeetings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
                        } catch (e) {
                            console.warn(e);
                        }
                    }}
                />
            )}

            {activeTab === 'docs' && (
                <DevOpsDocs 
                    onSpeakText={(text) => {
                        speakLine(text, "System Administrator");
                    }}
                />
            )}

            {activeTab === 'code' && (
                <CodeReviewPanel 
                    selectedPath={selectedCodePath}
                    comments={customCodeComments}
                    onChangePath={(path) => {
                        setSelectedCodePath(path);
                    }}
                />
            )}

            {/* Custom Modal for communication */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-350 dark:border-gray-700 rounded-xl p-5 max-w-sm w-full space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Simulated Communication Channel</h4>
                                <p className="text-[10px] text-gray-505">Initiating {showContactModal.type} with {showContactModal.agent.name}</p>
                            </div>
                            <button onClick={() => setShowContactModal(null)} className="text-gray-400 hover:text-gray-650" id="close_contact_btn">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-3.5 rounded border border-gray-100 dark:border-zinc-700/60 font-normal leading-relaxed text-xs text-gray-600 dark:text-gray-300">
                            {showContactModal.type === 'WhatsApp' ? (
                                <p>Simulating WhatsApp secure messaging link setup: <span className="text-teal-600 font-mono font-normal">https://api.whatsapp.com/send?phone=+966500000000&text=GRC_Boardroom_Briefing...</span></p>
                            ) : showContactModal.type === 'Phone Call' ? (
                                <p>Simulating outbound telephone callback: dialing <span className="text-teal-600 font-mono font-normal">+966114001000 ext 53</span>.</p>
                            ) : (
                                <p>Simulated secure email briefing sent to GRC remote mailbox: <span className="text-teal-600 font-mono font-normal">{showContactModal.agent.name.toLowerCase().replace(/\s+/g, '')}@gmail.com</span>.</p>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-gray-150">
                            <button
                                onClick={() => {
                                    setCommLedger(prev => [
                                        { id: Date.now(), timestamp: Date.now(), recipient: showContactModal.agent.name, channel: showContactModal.type, details: `Simulated contact initiated via ${showContactModal.type}` },
                                        ...prev
                                    ]);
                                    setShowContactModal(null);
                                    alert('Outbound communication logged to GRC command ledger.');
                                }}
                                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-normal"
                                id="log_conn_btn"
                            >
                                Close & Log Action
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Boardroom Workspace Panel */}
            {activeTab === 'boardroom' && (
                <>

            {/* LIVE COLLABORATION TOGGLE */}
            <div className="flex justify-end">
                <button
                    onClick={() => {
                        if (isLiveMode) {
                            // If ending, ask to generate MOM
                            if (confirm("End meeting and generate Minutes of Meeting?")) {
                                generateMOM();
                            } else {
                                setIsLiveMode(false);
                            }
                        } else {
                            setIsLiveMode(true);
                            setMeetingLog([]);
                            runSimulationTurn();
                        }
                    }}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-normal shadow-lg transition-all ${
                        isLiveMode 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {isLiveMode ? (
                        <>
                            <span className="h-3 w-3 bg-white rounded-full animate-ping"></span>
                            End & Generate MOM
                        </>
                    ) : (
                        <>
                            <ChatBotIcon className="w-5 h-5" />
                            Start Live Collaboration
                        </>
                    )}
                </button>
            </div>

            {/* LIVE MEETING ROOM VIEW */}
            {isLiveMode && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
                    {/* Discussion Log */}
                    <div className="lg:col-span-3 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 flex flex-col h-[600px]">
                        <div className="p-4 border-b border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-800 rounded-t-xl gap-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 bg-green-500 rounded-full animate-ping"></span>
                                <h3 className="text-white font-normal">
                                    {language === 'ar' ? 'اجتماع المحاذاة الاستراتيجي - مباشر' : 'Strategic Alignment Meeting - Live'}
                                </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-700/60">
                                <span className="text-slate-400 text-[11px] px-2 font-semibold uppercase">{language === 'ar' ? 'لغة الحوار:' : 'Dialog Language:'}</span>
                                <button 
                                    onClick={() => setBoardroomLang('en')}
                                    className={`px-2 py-1 rounded text-[11px] transition-all font-medium flex items-center gap-1 ${boardroomLang === 'en' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <span>EN</span> 🇬🇧
                                </button>
                                <button 
                                    onClick={() => setBoardroomLang('ar')}
                                    className={`px-2 py-1 rounded text-[11px] transition-all font-medium flex items-center gap-1 ${boardroomLang === 'ar' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <span>AR</span> 🇸🇦
                                </button>
                                <button 
                                    onClick={() => setBoardroomLang('ur')}
                                    className={`px-2 py-1 rounded text-[11px] transition-all font-medium flex items-center gap-1 ${boardroomLang === 'ur' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <span>UR</span> 🇵🇰
                                </button>
                                <button 
                                    onClick={() => setBoardroomLang('de')}
                                    className={`px-2 py-1 rounded text-[11px] transition-all font-medium flex items-center gap-1 ${boardroomLang === 'de' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <span>DE</span> 🇩🇪
                                </button>
                                <button 
                                    onClick={() => setBoardroomLang('zh')}
                                    className={`px-2 py-1 rounded text-[11px] transition-all font-medium flex items-center gap-1 ${boardroomLang === 'zh' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <span>ZH</span> 🇨🇳
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                {isAnalyzingDoc && <span className="text-xs text-purple-400 animate-pulse flex items-center"><EyeIcon className="w-3 h-3 mr-1"/> CNN Analysis Active...</span>}
                                {isThinking && <span className="text-xs text-gray-400 animate-pulse">Agents thinking...</span>}
                            </div>
                        </div>
                        
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {meetingLog.length === 0 && (
                                <div className="text-center text-gray-500 italic mt-20">Initializing Virtual Agents...</div>
                            )}
                            {meetingLog.map((entry, idx) => {
                                const agent = virtualAgents.find(a => a.name === entry.speaker);
                                const isUser = entry.speaker.startsWith("You");
                                return (
                                    <div key={idx} className={`flex items-start gap-4 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
                                        <div className="flex-shrink-0">
                                            {agent ? (
                                                <img src={agent.avatarUrl} className="w-10 h-10 rounded-full border border-gray-600" alt={entry.speaker} />
                                            ) : isUser ? (
                                                <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-normal">U</div>
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                            )}
                                        </div>
                                        <div className={`flex-grow max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                                            <div className={`flex items-baseline justify-between ${isUser ? 'flex-row-reverse' : ''}`}>
                                                <span className="font-normal text-teal-400 text-sm">{entry.speaker}</span>
                                                <span className="text-xs text-gray-500 mx-2">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div className={`mt-1 p-3 rounded-lg ${isUser ? 'bg-teal-900/50 border border-teal-700' : 'bg-gray-800 border border-gray-700'}`}>
                                                <p className="text-gray-200 text-sm">
                                                    {boardroomLang === 'ar' ? (entry.message_ar || entry.message_en) :
                                                     boardroomLang === 'ur' ? (entry.message_ur || entry.message_en) :
                                                     boardroomLang === 'de' ? (entry.message_de || entry.message_en) :
                                                     boardroomLang === 'zh' ? (entry.message_zh || entry.message_en) :
                                                     entry.message_en}
                                                </p>
                                                {boardroomLang !== 'en' && (
                                                    <p className="text-gray-400 text-xs mt-1 border-t border-gray-700/50 pt-1 opacity-75">
                                                        {entry.message_en}
                                                    </p>
                                                )}
                                                {boardroomLang === 'en' && entry.message_ar && (
                                                    <p className="text-gray-400 text-[11px] mt-1.5 border-t border-gray-700/50 pt-1 font-arabic" dir="rtl">
                                                        {entry.message_ar}
                                                    </p>
                                                )}
                                            </div>
                                            {entry.attachment && (
                                                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-800 rounded text-xs text-purple-300">
                                                    <PaperClipIcon className="w-3 h-3" />
                                                    Attached: {entry.attachment.name}
                                                </div>
                                            )}
                                            {entry.action && (
                                                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-800 rounded text-xs text-green-300">
                                                    <SparklesIcon className="w-3 h-3" />
                                                    {entry.action}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Meeting Controls Footer */}
                        <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                {/* Microphone */}
                                <button 
                                    onClick={toggleMic}
                                    className={`p-3 rounded-full transition-all duration-300 ${isMicActive ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    title={isMicActive ? "Mute Microphone" : "Speak to Team"}
                                >
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                                
                                {/* Document Upload */}
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                                    title="Upload Document for Analysis"
                                    disabled={isAnalyzingDoc}
                                >
                                    <UploadIcon className="w-5 h-5" />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,application/pdf"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {/* Direct Chat Text-Input so users can type questions */}
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget;
                                    const input = form.elements.namedItem('chatInput') as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                        handleUserSpeak(input.value.trim());
                                        input.value = '';
                                    }
                                }}
                                className="flex-grow flex gap-2 w-full md:w-auto"
                            >
                                <input
                                    name="chatInput"
                                    type="text"
                                    placeholder="Type your question or instruct the team..."
                                    className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 placeholder-gray-400"
                                    disabled={isThinking}
                                    id="agentic_chat_input"
                                />
                                <button
                                    type="submit"
                                    disabled={isThinking}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-normal disabled:opacity-50"
                                    id="agentic_chat_send"
                                >
                                    Send
                                </button>
                            </form>

                            <button 
                                onClick={() => runSimulationTurn()} 
                                disabled={isThinking}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm disabled:opacity-50 whitespace-nowrap"
                                id="agentic_chat_continue"
                            >
                                Continue
                            </button>
                        </div>
                    </div>

                    {/* Active Agents Status Sidebar */}
                    <div className="lg:col-span-1 space-y-3 h-[600px] overflow-y-auto pr-2">
                        {virtualAgents.map(agent => {
                            const isSpeaking = meetingLog.length > 0 && meetingLog[meetingLog.length - 1].speaker === agent.name;
                            return (
                                <div key={agent.id} className={`p-3 rounded-lg border transition-all duration-300 ${isSpeaking ? 'bg-teal-900/40 border-teal-500 scale-105 shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-80'}`}>
                                    <div className="flex items-center gap-3">
                                        <img src={agent.avatarUrl} className="w-8 h-8 rounded-full" alt={agent.name} />
                                        <div>
                                            <p className={`text-xs font-normal ${isSpeaking ? 'text-teal-300' : 'text-gray-700 dark:text-gray-300'}`}>{agent.name}</p>
                                            <p className="text-[10px] text-gray-500">{agent.role}</p>
                                        </div>
                                        {isSpeaking && (
                                            <div className="ml-auto flex gap-0.5">
                                                <div className="w-1 h-3 bg-teal-500 animate-bounce"></div>
                                                <div className="w-1 h-3 bg-teal-500 animate-bounce delay-100"></div>
                                                <div className="w-1 h-3 bg-teal-500 animate-bounce delay-200"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Upload Status Card */}
                        {uploadedFile && (
                            <div className="p-3 rounded-lg border border-purple-500 bg-purple-900/20 mt-4">
                                <p className="text-xs font-normal text-purple-300 flex items-center gap-2">
                                    <DocumentTextIcon className="w-3 h-3"/>
                                    Analyzing File
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1 truncate">{uploadedFile.name}</p>
                                <div className="w-full bg-gray-700 h-1 mt-2 rounded overflow-hidden">
                                    <div className="h-full bg-purple-500 animate-progress"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Standard Grid View (Visible when NOT in live mode) */}
            {!isLiveMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {virtualAgents.map(agent => (
                        <div 
                            key={agent.id} 
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all cursor-pointer overflow-hidden flex flex-col h-full ${selectedAgent?.id === agent.id ? 'border-teal-500 ring-2 ring-teal-200 dark:ring-teal-900' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
                            onClick={() => setSelectedAgent(agent)}
                        >
                            <div className="p-6 flex-grow">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="relative">
                                        <img src={agent.avatarUrl} alt={agent.name} className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md" />
                                        {agent.id === 'agent-abdullah' && (
                                            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-normal px-1.5 py-0.5 rounded-full animate-pulse border border-white">CNN ACTIVE</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-normal text-base text-gray-900 dark:text-white">{agent.name}</h3>
                                        <p className="text-sm font-normal text-teal-600 dark:text-teal-400">{agent.title}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{agent.description}</p>
                                
                                <div className="space-y-2">
                                    {agent.capabilities.slice(0, 3).map((cap, i) => (
                                        <div key={i} className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                            <ShieldCheckIcon className="w-3 h-3 mr-1.5 text-teal-500" />
                                            {cap}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                <span className="text-xs text-gray-500">Reports to: <span className="font-normal">{agent.reportingLine}</span></span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onConsultAgent(agent);
                                    }}
                                    className="flex items-center gap-1 text-xs font-normal text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                                >
                                    <MicrophoneIcon className="w-3 h-3" />
                                    Consult
                                </button>
                            </div>
                            {agent.currentTask && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/30 px-6 py-2 border-t border-yellow-100 dark:border-yellow-900/50">
                                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-normal truncate">
                                        <span className="animate-pulse mr-2">●</span>
                                        Working on: {agent.currentTask}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {selectedAgent && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                             <img src={selectedAgent.avatarUrl} alt={selectedAgent.name} className="w-20 h-20 rounded-full object-cover border-2 border-teal-500 shadow-md" />
                             <div>
                                <h2 className="text-lg font-normal text-gray-900 dark:text-white">
                                    {selectedAgent.name}
                                </h2>
                                <p className="text-teal-600 dark:text-teal-400 font-normal">{selectedAgent.title}</p>
                                <div className="flex gap-2 mt-2">
                                    {selectedAgent.jobAttributes.map((attr, i) => (
                                        <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                            {attr}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <button
                                onClick={() => onConsultAgent(selectedAgent)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-normal shadow-sm transition-colors"
                             >
                                 <MicrophoneIcon className="w-4 h-4" />
                                 Start Voice Session
                             </button>
                             <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-gray-600 p-2">Close</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-2">Professional Bio</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{selectedAgent.fullBio}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-normal text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-2">Key Responsibilities</h3>
                                <ul className="space-y-2">
                                    {selectedAgent.responsibilities.map((resp, i) => (
                                        <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                                            <span className="mr-2 text-teal-500">•</span>
                                            {resp}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-normal text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-3">Delegate Task</h3>
                                <form onSubmit={handleDelegate} className="space-y-4">
                                    <div className="relative">
                                        <textarea 
                                            className="w-full h-24 p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-teal-500 focus:border-teal-500 text-sm"
                                            placeholder={`Instruct ${selectedAgent.role} to perform a task within their domain...`}
                                            value={agentTaskInput}
                                            onChange={(e) => setAgentTaskInput(e.target.value)}
                                        ></textarea>
                                        <button
                                            type="button"
                                            onClick={toggleMicrophoneTaskDelegation}
                                            className={`absolute right-3 bottom-3 p-1.5 rounded-full transition-all ${
                                                isRecordingTaskVoice 
                                                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 animate-pulse' 
                                                : 'text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                            title="Speak your task description"
                                        >
                                            <MicrophoneIcon className="w-5 h-5 animate-pulse-slow" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 font-sans">
                                            {isRecordingTaskVoice ? '🎙️ Listening... Speak now...' : 'Click mic to speak task'}
                                        </span>
                                        <button 
                                            type="submit" 
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-normal rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none"
                                            disabled={!agentTaskInput.trim()}
                                        >
                                            <SparklesIcon className="w-4 h-4 mr-2" />
                                            Delegate Task
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        
                        <div className="md:col-span-1 space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-normal text-gray-700 dark:text-gray-200 mb-3">Capabilities</h3>
                                <ul className="space-y-2">
                                    {selectedAgent.capabilities.map((cap, i) => (
                                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start font-normal">
                                            <ShieldCheckIcon className="w-3 h-3 mr-2 text-green-500" />
                                            {cap}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {/* EMBEDDED AGENT WORKBOARD */}
                            <div className="bg-teal-50/50 dark:bg-teal-950/20 rounded-lg p-4 border border-teal-100 dark:border-teal-900/50 space-y-3">
                                <h3 className="text-xs uppercase tracking-wider font-normal text-teal-800 dark:text-teal-400">
                                    Embedded Agent Workboard
                                </h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
                                    Active tasks assigned to {selectedAgent.name} with dedicated functional RACI responsibility.
                                </p>
                                
                                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                    {delegatedTasks.filter(t => t.assignedAgent === selectedAgent.name).length === 0 ? (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic font-normal">
                                            No active tasks delegated to this agent.
                                        </p>
                                    ) : (
                                        delegatedTasks.filter(t => t.assignedAgent === selectedAgent.name).map(task => (
                                            <div key={task.id} className="p-2.5 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-750 space-y-1">
                                                <div className="flex justify-between items-center gap-1">
                                                    <span className="text-xs font-normal text-gray-800 dark:text-gray-200 truncate max-w-[140px]" title={task.title}>
                                                        {task.title}
                                                    </span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-normal ${
                                                        task.status === 'Done' ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300' :
                                                        task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300 animate-pulse' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 pt-1 font-normal">
                                                    <span>RACI Role: <span className="text-teal-600 dark:text-teal-400 font-normal">{task.raciStatus}</span></span>
                                                    {task.status !== 'Done' && (
                                                        <button
                                                            onClick={() => simulateTaskProgress(task.id)}
                                                            disabled={!!activeWorkingTaskId}
                                                            className="text-teal-600 dark:text-teal-400 hover:underline font-normal bg-transparent border-0 p-0 cursor-pointer"
                                                        >
                                                            Run Task
                                                        </button>
                                                    )}
                                                </div>
                                                {task.status === 'In Progress' && (
                                                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 rounded overflow-hidden mt-1">
                                                        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${task.progress}%` }}></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {selectedAgent.id === 'agent-abdullah' && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs font-normal">
                                    <span className="block text-blue-700 dark:text-blue-300 mb-1 font-normal">CNN Feature Embedding</span>
                                    Analyzing compliance artifacts with 98.5% accuracy for automated categorization.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* GRC RESPONSIBILITY & RACI ACTIVE DELEGATION BOARD */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <div>
                    <h2 className="text-base font-normal text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-teal-600" />
                        GRC Boardroom Workflows & RACI Authority Boundaries
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Task allocation and alignment matrix mapping functional roles to standard SAMA CSF and NCA ECC mandates.
                    </p>
                </div>

                {/* ACTIVE WORKING SIMULATOR BANNER */}
                {activeWorkingTaskId && (
                    <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-lg space-y-2 animate-pulse">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-normal text-teal-800 dark:text-teal-300">
                                AI agent active execution thread in progress...
                            </span>
                            <span className="text-xs font-mono text-teal-600">
                                {delegatedTasks.find(t => t.id === activeWorkingTaskId)?.progress}%
                            </span>
                        </div>
                        <div className="w-full bg-teal-100 dark:bg-teal-900 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-teal-500 transition-all duration-500" 
                                style={{ width: `${delegatedTasks.find(t => t.id === activeWorkingTaskId)?.progress}%` }}
                            ></div>
                        </div>
                        <div className="space-y-1">
                            {simulationLogs.slice(-2).map((log, i) => (
                                <p key={i} className="text-xs text-teal-700 dark:text-teal-400 font-mono">
                                    &gt; {log}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* TWO COLUMN GRID: RACI CHART + ACTIVE DELEGATIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-normal">
                    
                    {/* RACI AUTHORITY MATRIX */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-normal text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                            RACI Responsibility Matrix
                        </h3>
                        <div className="overflow-x-auto border border-gray-105 dark:border-gray-700 rounded-lg">
                            <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
                                <thead className="bg-gray-50 dark:bg-gray-900 text-[10px] text-gray-700 dark:text-gray-300 uppercase tracking-wider font-normal">
                                    <tr>
                                        <th className="px-3 py-2 font-normal">GRC Domain / Program</th>
                                        <th className="px-3 py-2 text-center font-normal">CISO</th>
                                        <th className="px-3 py-2 text-center font-normal">CTO</th>
                                        <th className="px-3 py-2 text-center font-normal">Compliance</th>
                                        <th className="px-3 py-2 text-center font-normal">Auditor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-normal">
                                    <tr>
                                        <td className="px-3 py-2.5 font-normal text-gray-900 dark:text-white">Security Governance & Policy</td>
                                        <td className="px-3 py-2.5 text-center text-teal-600 font-normal">[A]</td>
                                        <td className="px-3 py-2.5 text-center text-gray-400">C</td>
                                        <td className="px-3 py-2.5 text-center text-purple-600 font-normal">[R]</td>
                                        <td className="px-3 py-2.5 text-center text-gray-400">C</td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-2.5 font-normal text-gray-900 dark:text-white">Technical Infrastructure Remediation</td>
                                        <td className="px-3 py-2.5 text-center text-gray-400 font-normal">C</td>
                                        <td className="px-3 py-2.5 text-center text-teal-600 font-normal">[R]</td>
                                        <td className="px-3 py-2.5 text-center text-gray-400 font-normal">I</td>
                                        <td className="px-3 py-2.5 text-center text-gray-400 font-normal">I</td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-2.5 font-normal text-gray-900 dark:text-white">Continuous GRC Audit Checks</td>
                                        <td className="px-3 py-2.5 text-center text-gray-400 font-normal">I</td>
                                        <td className="px-3 py-2.5 text-center text-gray-400 font-normal">C</td>
                                        <td className="px-3 py-2.5 text-center text-gray-400 font-normal font-normal">C</td>
                                        <td className="px-3 py-2.5 text-center text-teal-600 font-normal">[A/R]</td>
                                    </tr>
                                    <tr>
                                        <td className="px-3 py-2.5 font-normal text-gray-900 dark:text-white">Risk Register & Mitigation</td>
                                        <td className="px-3 py-2.5 text-center text-teal-600 font-normal">[A]</td>
                                        <td className="px-3 py-2.5 text-center text-gray-400">C</td>
                                        <td className="px-3 py-2.5 text-center text-purple-600 font-normal">[R]</td>
                                        <td className="px-3 py-2.5 text-center text-gray-400">I</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="flex gap-4 text-[10px] text-gray-500 dark:text-gray-400 pt-1">
                            <span><strong className="text-teal-600 font-normal">[R]</strong> Responsible (Executes Task)</span>
                            <span><strong className="text-purple-600 font-normal">[A]</strong> Accountable (Approves & owns)</span>
                            <span><strong className="text-gray-600 dark:text-gray-300 font-normal">[C]</strong> Consulted</span>
                            <span><strong className="text-gray-600 dark:text-gray-300 font-normal">[I]</strong> Informed</span>
                        </div>
                    </div>

                    {/* ACTIVE FLOWS & TASK QUEUE BOARD */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs">
                            <h3 className="text-sm font-normal text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                                Active Agentic Workflow Board
                            </h3>
                            <button
                                onClick={() => {
                                    if (confirm("Reset active board to original standard template?")) {
                                        localStorage.removeItem('grc_delegated_tasks');
                                        window.location.reload();
                                    }
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-normal"
                            >
                                Reset Tasks
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {delegatedTasks.length === 0 ? (
                                <p className="text-xs text-gray-500 italic py-4">No delegated tasks yet. Select an agent above to delegate work.</p>
                            ) : (
                                delegatedTasks.map(task => (
                                    <div key={task.id} className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-750 flex flex-col justify-between gap-3 text-xs">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-normal text-gray-900 dark:text-white leading-normal truncate max-w-[70%]">
                                                    {task.title}
                                                </h4>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-normal ${
                                                    task.status === 'Done' ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300' :
                                                    task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300 animate-pulse' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                }`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {task.description}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-normal text-gray-805 dark:text-gray-300">
                                                    {task.assignedAgent} ({task.assignedRole})
                                                </span>
                                                <span className="text-xs text-teal-600 dark:text-teal-400">
                                                    [{task.raciStatus}]
                                                </span>
                                            </div>
                                            
                                            {task.status !== 'Done' ? (
                                                <button
                                                    onClick={() => simulateTaskProgress(task.id)}
                                                    disabled={!!activeWorkingTaskId}
                                                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded font-normal hover:shadow-xs transition-colors"
                                                >
                                                    Work on Task
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    {task.outputs?.map((out, idx) => (
                                                        <span 
                                                            key={idx} 
                                                            className="text-teal-600 dark:text-teal-400 font-normal underline flex items-center gap-1 cursor-pointer"
                                                            onClick={() => alert(`Reviewing generated output artifact in main repository: "${out.name}"`)}
                                                        >
                                                            <SparklesIcon className="w-3 h-3 text-teal-500" />
                                                            View Artifact
                                                        </span>
                                                    ))}
                                                    <span className="text-green-600 dark:text-green-400 font-normal flex items-center gap-1">
                                                        ✓ Ready
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* AGENT COLLABORATION FEED */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <div>
                    <h2 className="text-base font-normal text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                        </span>
                        GRC Boardroom Collaboration Feed
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-normal">
                        Communication logs filtered specifically for recent cross-agent coordination, approvals, and dynamic RACI handovers.
                    </p>
                </div>

                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
                    {collaborationLogs.length === 0 ? (
                        <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400 italic font-normal space-y-2">
                            <p>No agentic task collaborations or handovers logged in the ledger yet.</p>
                            <p className="text-[10px] text-gray-400 font-normal">Trigger task execution or boardroom dialogues to populate this feed.</p>
                        </div>
                    ) : (
                        collaborationLogs.map((entry) => {
                            return (
                                <div key={entry.id} className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-150 dark:border-gray-750 flex flex-col gap-1.5 text-xs font-normal">
                                    <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400">
                                        <span className="font-mono font-normal">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </span>
                                        <span className="font-mono font-normal px-2 py-0.5 bg-teal-50 dark:bg-teal-950/35 text-teal-700 dark:text-teal-300 rounded text-[9px] border border-teal-100 dark:border-teal-900/40 font-normal">
                                            {entry.action}
                                        </span>
                                    </div>
                                    <div className="text-gray-700 dark:text-gray-300 font-normal">
                                        <span className="text-teal-600 dark:text-teal-400 font-normal font-mono mr-1">
                                            [{entry.userName || 'SYSTEM'}]
                                        </span>
                                        {entry.details}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
                </>
            )}

            <style>{`
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }
                .animate-progress {
                    animation: progress 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
