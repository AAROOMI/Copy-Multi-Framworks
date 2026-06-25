import React, { useState } from 'react';
import { 
  Database, RefreshCw, Layers, Calendar, User, FileText, Check, Users, Clock, AlertCircle
} from 'lucide-react';

interface TranscriptItem {
  speaker: string;
  message_en: string;
  message_ar?: string;
  timestamp: number;
}

interface MeetingSession {
  id?: string;
  title: string;
  momContent: string;
  transcript: TranscriptItem[];
  createdAt: number;
  complianceDelta?: number;
}

interface MemoryVaultProps {
  pastMeetings: MeetingSession[];
  lastMeetingMOM: string;
  isSavingSession: boolean;
  isOnline: boolean;
  onRefreshHistory: () => void;
}

export const MemoryVault: React.FC<MemoryVaultProps> = ({
  pastMeetings,
  lastMeetingMOM,
  isSavingSession,
  isOnline,
  onRefreshHistory
}) => {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshHistory();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const selectedMeeting = pastMeetings.find(m => m.id === selectedMeetingId || (m.createdAt && m.createdAt.toString() === selectedMeetingId));
  const activeMOM = selectedMeeting ? selectedMeeting.momContent : lastMeetingMOM;

  const formatDate = (epoch: number) => {
    return new Date(epoch).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-250 dark:border-gray-700 p-5 space-y-6">
      <div className="border-b border-gray-100 dark:border-gray-700 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-600" />
            Continuous Corporate Memory Vault (Persistent GRC Context Engine)
          </h2>
          <p className="text-xs text-gray-500 font-normal">
            Agents share a unified memory repository synced directly with Google Cloud Firestore database, enabling recall of past meeting dialogs, agenda compliance targets, and decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] px-2 py-1 bg-teal-50 dark:bg-teal-950/45 text-teal-600 dark:text-teal-400 border border-teal-250 rounded font-normal font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>{isOnline ? "Connected Firestore Core" : "Offline Sandbox Backup"}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 px-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-350 border border-gray-250 rounded text-xs font-normal transition-all flex items-center gap-1"
            id="sync_firestore_btn"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh State
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Historical Meetings list */}
        <div className="lg:col-span-4 space-y-3.5">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Historic Boardroom Sessions
          </h3>
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-2">
            {pastMeetings.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg text-[11px] text-gray-500 border border-gray-150 text-center font-normal">
                No past sessions saved to cloud yet. Initialize a live boardroom conference to store persistent minutes.
              </div>
            ) : (
              pastMeetings.map((session, idx) => {
                const uniqueKey = session.id || session.createdAt.toString();
                const isSelected = selectedMeetingId === uniqueKey || (!selectedMeetingId && idx === 0);
                return (
                  <div
                    key={uniqueKey}
                    onClick={() => setSelectedMeetingId(uniqueKey)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-teal-50/40 dark:bg-teal-900/10 border-teal-500"
                        : "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xs font-normal text-gray-900 dark:text-white truncate">
                      {session.title || `Boardroom alignment session #${idx + 1}`}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2 font-normal">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(session.createdAt)}</span>
                      {session.complianceDelta && (
                        <span className="text-teal-600 dark:text-teal-400 font-normal">
                          +{session.complianceDelta}% Compliance Delta
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Minutes of Meeting (MOM) & Dialogue Context */}
        <div className="lg:col-span-8 bg-gray-50/50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-2.5 flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-normal flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              Active Context: Meeting Minutes of Meeting (MOM) Record
            </span>
            <span className="text-zinc-400 text-[10px] font-normal">
              {selectedMeeting ? "Browsing Archive" : "Current Active Work Session"}
            </span>
          </div>

          <div className="space-y-4 font-normal">
            {activeMOM ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-inner text-gray-700 dark:text-gray-300 text-[11.5px] leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap font-sans">
                {activeMOM}
              </div>
            ) : (
              <div className="py-24 text-center space-y-2.5">
                <AlertCircle className="w-6 h-6 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-500 italic font-normal">
                  No previous meeting minutes recorded. Choose "Start Collaboration Session" to initiate boardroom alignments and record official moments.
                </p>
              </div>
            )}

            {/* Past Transcripts viewer if archived meeting is loaded */}
            {selectedMeeting && selectedMeeting.transcript && (
              <div className="space-y-2 pt-3 border-t border-gray-250">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Select Transcript Log (Excerpt)
                </p>
                <div className="space-y-2 max-h-[120px] overflow-y-auto bg-gray-100/60 dark:bg-gray-900/40 border border-gray-250 p-2 rounded text-[10.5px] leading-normal font-mono font-normal">
                  {selectedMeeting.transcript.slice(0, 10).map((log, lIdx) => (
                    <p key={lIdx} className="text-zinc-600 dark:text-zinc-300">
                      <span className="text-teal-600 dark:text-teal-400">{log.speaker}:</span> {log.message_en}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
