import React, { useState, useEffect } from 'react';
import { 
    Zap, 
    Share2, 
    MessageSquare, 
    Activity, 
    Bell, 
    Check, 
    Compass, 
    Play, 
    Cpu, 
    ArrowRight,
    Terminal,
    Database,
    Shield
} from 'lucide-react';
import type { User } from '../types';

interface SolaceEvent {
    id: string;
    topic: string;
    sender: string;
    timestamp: string;
    payload: any;
    status: 'published' | 'subscribers_notified' | 'processing' | 'done';
    reactions: string[];
}

export const SolaceAgentMesh: React.FC = () => {
    const [events, setEvents] = useState<SolaceEvent[]>([
        {
            id: 'evt-1',
            topic: 'grc/agent/risk/detected',
            sender: 'Rashid AI (Risk Manager)',
            timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
            payload: { riskId: 'risk-02', score: 85, description: 'Untrusted endpoint remote access configured on perimeter VPN.' },
            status: 'done',
            reactions: [
                'Ahmed AI (CISO) updated risk register entry.',
                'Fahad AI (CTO) revoked vulnerable security configurations.'
            ]
        },
        {
            id: 'evt-2',
            topic: 'grc/agent/policy/update',
            sender: 'Asaad AI (Compliance Officer)',
            timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(),
            payload: { policyName: 'ISO 27001 Access Control Standard', version: '2.1' },
            status: 'done',
            reactions: [
                'Abdullah AI (Auditor) queued compliance validation tests.',
                'Ibrahim AI (DOP) updated operational staff guidelines.'
            ]
        }
    ]);

    const [pubTopic, setPubTopic] = useState('grc/agent/risk/detected');
    const [pubAgent, setPubAgent] = useState('Rashid AI (Risk Manager)');
    const [customPayload, setCustomPayload] = useState('Untrusted wireless beacon detected inside corporate secure zone.');
    const [isPublishing, setIsPublishing] = useState(false);
    const [meshConnected, setMeshConnected] = useState(true);

    const publishManualEvent = () => {
        if (!customPayload.trim()) return;
        setIsPublishing(true);

        const newEventId = `evt-${Date.now()}`;
        const newEvent: SolaceEvent = {
            id: newEventId,
            topic: pubTopic,
            sender: pubAgent,
            timestamp: new Date().toLocaleTimeString(),
            payload: { message: customPayload, ts: Date.now() },
            status: 'published',
            reactions: []
        };

        setEvents(prev => [newEvent, ...prev]);

        // Simulate event routing through Solace event broker
        setTimeout(() => {
            setEvents(prev => prev.map(evt => {
                if (evt.id === newEventId) {
                    return { ...evt, status: 'subscribers_notified' };
                }
                return evt;
            }));

            setTimeout(() => {
                let simulatedReactions: string[] = [];
                if (pubTopic === 'grc/agent/risk/detected') {
                    simulatedReactions = [
                        'Ahmed AI (CISO) triggered high-priority investigation.',
                        'Ibrahim AI (DOP) assigned on-duty field technician.'
                    ];
                } else if (pubTopic === 'grc/agent/policy/update') {
                    simulatedReactions = [
                        'Abdullah AI (Auditor) updated active audit policy baseline list.',
                        'Fahad AI (CTO) configured automated configuration compliance drift alarms.'
                    ];
                } else {
                    simulatedReactions = [
                        'Mohammed AI (CIO) updated IT portfolio governance alignment map.',
                        'Asaad AI (Compliance) revised SAMA audit checklist indexes.'
                    ];
                }

                setEvents(prev => prev.map(evt => {
                    if (evt.id === newEventId) {
                        return { ...evt, status: 'done', reactions: simulatedReactions };
                    }
                    return evt;
                }));
                setIsPublishing(false);
            }, 1000);
        }, 800);
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 dark:border-gray-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-normal text-teal-605 dark:text-teal-400 flex items-center gap-2 uppercase tracking-widest">
                        <Zap className="w-5 h-5 text-teal-500" />
                        Solace Event-Driven Multi-Agent Mesh
                    </h2>
                    <p className="text-xs text-gray-505 dark:text-gray-400 mt-1 font-normal">
                        Choreograph GRC actions in real-time across AI agents using solace-agent-mesh topic matching.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase text-gray-400">Mesh Status:</span>
                    <button 
                        onClick={() => setMeshConnected(!meshConnected)}
                        className={`px-2.5 py-1 rounded text-[10px] uppercase font-mono transition-all border ${
                            meshConnected 
                                ? 'bg-emerald-50 text-emerald-705 border-emerald-200 dark:bg-emerald-950/20' 
                                : 'bg-rose-50 text-rose-705 border-rose-200 dark:bg-rose-950/20'
                        }`}
                    >
                        {meshConnected ? '● Solace Connected' : '○ Local LLM Dispatch'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-150 dark:divide-gray-850">
                {/* Publish Inject Panel */}
                <div className="lg:col-span-5 p-6 space-y-6">
                    <h3 className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wider">Event Injector & Broker Dispatch</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Publishing Agent Node</label>
                            <select 
                                value={pubAgent} 
                                onChange={e => setPubAgent(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-2 px-3 text-xs outline-none"
                            >
                                <option value="Rashid AI (Risk Manager)">Rashid AI (Risk Manager)</option>
                                <option value="Asaad AI (Compliance Officer)">Asaad AI (Compliance Officer)</option>
                                <option value="Fahad AI (CTO)">Fahad AI (CTO)</option>
                                <option value="Ahmed AI (CISO)">Ahmed AI (CISO)</option>
                                <option value="Abdullah AI (Internal Auditor)">Abdullah AI (Internal Auditor)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Target Topic Address</label>
                            <select 
                                value={pubTopic} 
                                onChange={e => setPubTopic(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-2 px-3 text-xs outline-none"
                            >
                                <option value="grc/agent/risk/detected">grc/agent/risk/detected</option>
                                <option value="grc/agent/policy/update">grc/agent/policy/update</option>
                                <option value="grc/agent/action/remediation">grc/agent/action/remediation</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-normal text-gray-500 uppercase tracking-widest mb-1">Event Payload / Narrative</label>
                            <textarea 
                                value={customPayload} 
                                onChange={e => setCustomPayload(e.target.value)}
                                rows={3}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg py-2.5 px-3 text-xs outline-none resize-none font-sans"
                                placeholder="Describe the physical security change or asset vulnerability..."
                            />
                        </div>

                        <button 
                            onClick={publishManualEvent}
                            disabled={isPublishing || !customPayload.trim()}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded py-2 px-4 text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                            {isPublishing ? 'Broker Routing Message...' : 'Publish event onto mesh'}
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-150 dark:border-gray-850/80">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2 font-normal">Active Topic Subscriptions</span>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-mono text-gray-500">
                                <span>grc/agent/risk/*</span>
                                <span className="text-teal-600">3 Listeners</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-mono text-gray-500">
                                <span>grc/agent/policy/*</span>
                                <span className="text-teal-600">2 Listeners</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-mono text-gray-500">
                                <span>grc/agent/action/*</span>
                                <span className="text-teal-600">4 Listeners</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mesh Feed Stream */}
                <div className="lg:col-span-7 p-6 space-y-4">
                    <h3 className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wider">Live event mesh transaction feed</h3>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {events.map((evt) => (
                            <div key={evt.id} className="bg-gray-50 dark:bg-gray-900/60 p-4 border border-gray-150 dark:border-gray-800/80 rounded-xl space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-100 rounded">
                                            {evt.topic}
                                        </span>
                                        <p className="text-[11px] text-gray-500 font-mono mt-2">Sender: {evt.sender}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono">{evt.timestamp}</span>
                                </div>

                                <div className="bg-white dark:bg-gray-950 p-2.5 rounded border border-gray-100 dark:border-gray-800/50">
                                    <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">{JSON.stringify(evt.payload, null, 2)}</p>
                                </div>

                                <div className="space-y-1.5 pt-1.5 border-t border-gray-150/80 dark:border-gray-850">
                                    <span className="text-[9px] uppercase tracking-wider text-gray-400 font-normal">Orchestrated cascade responses:</span>
                                    {evt.reactions.length === 0 ? (
                                        <span className="text-[10px] italic text-amber-500 block">Routing to broker subscribers...</span>
                                    ) : (
                                        evt.reactions.map((react, i) => (
                                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400 font-normal">
                                                <ArrowRight className="w-3 h-3 text-teal-500 flex-shrink-0" />
                                                <span>{react}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
