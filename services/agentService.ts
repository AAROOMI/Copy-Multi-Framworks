
import { AIService } from './aiService';
import type { GRCAgentDecision, GRCComplianceStatus, GRCNFAAction, GRCAgentRole, GRCMeetingMessage, GRCAnalysisModels, GRCMOM } from '../types';

export interface OrchestratorDecision {
    summary: string;
    riskLevel: 'low' | 'medium' | 'high';
    complianceStatus: GRCComplianceStatus;
    nfa: Omit<GRCNFAAction, 'id' | 'decisionId' | 'createdAt'>[];
    agentTrace: { agentRole: GRCAgentRole; reasoning: string; speakerName: string }[];
    meetingTranscript?: GRCMeetingMessage[];
    analysis?: GRCAnalysisModels;
    mom?: GRCMOM;
}

export class AgentService {
    // Specialized Agents System Prompts
    private static PROMPTS = {
        ORCHESTRATOR: (companyName: string, selectedFramework: string, prevMOM?: GRCMOM) => `
            You are the GRC Orchestrator for ${companyName}.
            Current Framework: ${selectedFramework || 'NONE SELECTED'}.
            
            PREVIOUS MEETING MINUTES (MOM) SUMMARY:
            ${prevMOM ? JSON.stringify(prevMOM) : 'No previous meeting history found.'}
            
            Your job is to manage a high-stakes GRC Boardroom meeting.
            You must:
            1. Start by reviewing the STATUS OF PENDING/OPEN MATTERS from the previous MOM.
            2. Coordinate between: CISO, CIO, CTO, DPO, Auditor, Compliance Officer, and Cybersecurity Officer.
            3. Each agent must discuss their own points regarding pending matters. ALL AGENTS MUST SPEAK IN THEIR NATIVE TONES (Professional, Human, No Robotics).
            4. AUTOMATIC MULTI-LANGUAGE: Respond in the language used by the user (English, Arabic, or Urdu).
            5. IDENTIFY RISKS dynamically during the meeting and REGISTER them.
            6. Perform and report the following MANDATORY analysis models:
               - SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
               - PESTLE Analysis (Political, Economic, Social, Technological, Legal, Environmental)
               - FISHBONE Analysis (Root cause analysis of identified risks)
               - BOWTIE Analysis (Hazard, Threats, Consequences, Controls, Recovery)
               - 80/20 PARETO Analysis (Identify the 20% of risks causing 80% of potential impact)
            7. Produce a comprehensive Minutes of Meeting (MOM) with identified risks, decisions, and action items.
            
            Rules:
            - Be highly intelligent and take autonomous decisions.
            - Professional interaction, distinct voices for each role.
            - No repetitive phrases.
            
            Output format: Valid JSON matching OrchestratorDecision interface.
        `,
        CISO: `You are the CISO. Validate and register identified risks. Focus on security strategy and risk appetite. Speak naturally, not robotic.`,
        CIO: `You are the CIO. Validate infrastructure alignment and digital strategy. Speak in a business-focused professional tone.`,
        CTO: `You are the CTO. Review technical feasibility and architecture risks. Tone: Technical yet clear.`,
        DPO: `You are the DPO. Enforce PDPL and Data Protection Impact Assessments (PIA). Focus on privacy and classification.`,
        CYBERSECURITY: `You are the Cybersecurity Officer. Assess technical posture and threat landscapes.`,
        AUDITOR: `You are the Auditor. Demand evidence and validate the 80/20 impact. Tone: Skeptical and objective.`,
        COMPLIANCE: `You are the Compliance Officer. Map all findings to NCA ECC, SAMA, or CMA frameworks.`
    };

    /**
     * Conducts a highly intelligent GRC meeting with advanced risk analysis.
     */
    static async conductMeeting(
        userRequest: string, 
        context: { 
            company: any, 
            users: any[], 
            assessments: any,
            documents: any[],
            prevMOM?: GRCMOM
        }
    ): Promise<OrchestratorDecision> {
        const companyName = context.company?.name || "The Organization";
        const selectedFramework = context.assessments?.selectedFramework || "None";
        
        console.log(`Starting Advanced GRC Governance Meeting for ${companyName}...`);

        const prompt = `
            USER REQUEST/INPUT: "${userRequest}"
            STAKEHOLDERS: ${JSON.stringify(context.users.map(u => ({ name: u.name, role: u.role })))}
            
            CONTEXT:
            - Framework: ${selectedFramework}
            - Previous MOM: ${JSON.stringify(context.prevMOM)}
            - Documents: ${context.documents.length}
            - Assessments: ${JSON.stringify(context.assessments)}

            Simulate a realistic boardroom interaction. 
            Identify at least 2 new risks.
            Perform SWOT, PESTLE, Fishbone, Bowtie, and Pareto analysis.
            Generate a full MOM with pending actions.
        `;

    const loadAgentDecision = async () => {
        if (!window.navigator.onLine) {
            const localResponse = await import('./localLLM').then(m => m.LocalLLM.generateResponse(userRequest));
            try {
                return JSON.parse(localResponse) as OrchestratorDecision;
            } catch {
                // Return a basic fallback structure if local response isn't JSON
                return {
                    summary: localResponse,
                    riskLevel: 'low',
                    complianceStatus: 'undetermined',
                    nfa: [{ action: "Check connectivity for full GRC Boardroom meeting.", priority: "medium", status: "open" }],
                    agentTrace: [{ agentRole: "Orchestrator", speakerName: "Rashid (Local)", reasoning: "Running in offline mode due to no connectivity." }],
                    analysis: {},
                    mom: { id: "offline-" + Date.now(), meetingDate: Date.now(), participants: [], discussionPoints: ["Operating in Offline Mode"], identifiedRisks: [], decisions: [], pendingActions: [] }
                } as any as OrchestratorDecision;
            }
        }

        return await AIService.generateStructuredContent<OrchestratorDecision>(
            prompt,
            {
                type: "object",
                properties: {
                    summary: { type: "string" },
                    riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                    complianceStatus: { type: "string", enum: ["compliant", "non-compliant", "undetermined"] },
                    nfa: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                action: { type: "string" },
                                priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                                status: { type: "string", enum: ["open", "in_progress", "done"] }
                            },
                            required: ["action", "priority", "status"]
                        }
                    },
                    agentTrace: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                agentRole: { type: "string" },
                                speakerName: { type: "string" },
                                reasoning: { type: "string" }
                            }
                        }
                    },
                    analysis: {
                        type: "object",
                        properties: {
                            swot: { $ref: "#/definitions/swot" },
                            pestle: { $ref: "#/definitions/pestle" },
                            fishbone: { $ref: "#/definitions/fishbone" },
                            bowtie: { $ref: "#/definitions/bowtie" },
                            pareto8020: { $ref: "#/definitions/pareto" }
                        }
                    },
                    mom: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            meetingDate: { type: "number" },
                            participants: { type: "array", items: { type: "object", properties: { role: { type: "string" }, name: { type: "string" } } } },
                            discussionPoints: { type: "array", items: { type: "string" } },
                            identifiedRisks: { type: "array", items: { type: "object", properties: { title: { type: "string" }, level: { type: "string" } } } },
                            decisions: { type: "array", items: { type: "string" } },
                            pendingActions: { type: "array", items: { type: "object", properties: { action: { type: "string" }, assignee: { type: "string" }, dueDate: { type: "number" }, status: { type: "string" } } } }
                        }
                    }
                },
                required: ["summary", "riskLevel", "complianceStatus", "nfa", "agentTrace", "analysis", "mom"]
            },
            'gemini-3-flash-preview',
            this.PROMPTS.ORCHESTRATOR(companyName, selectedFramework, context.prevMOM)
        );
    };

    const decision = await loadAgentDecision();
    return decision;
    }
}
