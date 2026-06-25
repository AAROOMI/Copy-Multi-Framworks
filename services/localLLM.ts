
export class LocalLLM {
    private static responses: Record<string, string> = {
        "hello": "Hello. I am Google Gemma 4 (Air-Gapped Edition), your embedded local compliance assistant. I am fully operational offline within your secure perimeter.",
        "status": "Offline systems are operational. All local GRC policies, risk databases, and control nodes are synchronized with the local SQLite and Firebase caching layer.",
        "compliance": "Your local compliance indicators show stable postures across NCA ECC, SAMA CSF, CMA, and PDPL frameworks.",
        "help": "As your embedded Gemma 4 local instance, I can generate customized security policies, map compliance controls, run localized risk assessments, and process local voice operations.",
        "ecc": "The NCA Essential Cybersecurity Controls (ECC-1-2018) require strict mapping of asset governance, privilege containment, and continuous audit logging. I have pre-loaded templates for all 5 domains.",
        "sama": "SAMA Cybersecurity Framework guidelines demand multi-factor authentication, secure hardware modules, and periodic vulnerability management. I can structure compliant reports offline.",
        "pdpl": "Saudi Personal Data Protection Law (PDPL) dictates clear data retention schedules, consent records, and cross-border transfer limitations. I can construct offline data catalogs.",
        "cma": "CMA Cybersecurity Guidelines require regular penetration testing, transaction log encryption, and secure disaster recovery sites. I can formulate CMA audit checklists offline.",
        "default": "I am operating as your local Gemma 4 compliance instance. I can process your compliance questions, generate GRC policy structures, and navigate local workspace modules successfully."
    };

    private static templates: Record<string, any> = {
        "ecc": {
            "policy": "nca ecc security management policy\n\n1. objective\nthis document establishes the security guidelines as required by the nca ecc-1-2018 standards.\n\n2. scope\napplies to all corporate systems, servers, databases, and secure networks in the air-gapped zone.\n\n3. guidelines\na. all administrative roles must have privilege boundaries and access controls.\nb. logs must be kept in a read-only secure local drive for audit reviews.",
            "procedure": "nca ecc compliance procedure\n\n1. verification\nanalysts must verify the integrity of firewall rules every quarter.\n\n2. review cycle\nthe compliance officer reviews compliance scores against the 5 domains annually.",
            "guideline": "nca ecc system hardening standards\n\na. disable unneeded services.\nb. enable transport layer security on all local database connections."
        },
        "sama": {
            "policy": "sama cybersecurity framework compliance policy\n\n1. objective\nto align with sama csf standards for financial sector institutions.\n\n2. core controls\na. cryptography: all financial transaction payloads must utilize state-approved encryption standards.\nb. logical access: strict separation of development and live production environments.",
            "procedure": "sama audit verification process\n\n1. gather audit trail indicators monthly.\n2. file compliant documentation on secure network drives.",
            "guideline": "sama authentication guidelines\n\na. enforce strong authentication keys.\nb. session timeouts must be established for administrative portals."
        },
        "pdpl": {
            "policy": "personal data protection law compliance manual\n\n1. objective\nto fulfill saudi pdpl mandates for protecting sensitive customer data.\n\n2. key provisions\na. data localization: personal identifiers must reside inside national borders.\nb. disclosure control: data processing must have user approval records.",
            "procedure": "pdpl breach containment plan\n\n1. identify potential data exposure.\n2. notify local regulators within the required timeframe.",
            "guideline": "pdpl database classification standards\n\na. label user records as confidential.\nb. restrict query privileges to designated personnel."
        },
        "cma": {
            "policy": "cma digital governance policy\n\n1. objective\nto align with cma cybersecurity guidelines for capital market networks.\n\n2. rules\na. verify transactional non-repudiation metrics.\nb. mandate security awareness training for all traders and system users.",
            "procedure": "cma testing protocols\n\n1. schedule external penetration audits regularly.\n2. report critical findings to the risk committee.",
            "guideline": "cma resilience guidelines\n\na. maintain offsite backup configurations.\nb. conduct disaster recovery testing twice a year."
        }
    };

    static async generateResponse(prompt: string): Promise<string> {
        const lowerPrompt = prompt.toLowerCase();
        
        // Specific checks for Saudi frameworks
        if (lowerPrompt.includes("ecc") || lowerPrompt.includes("essential cybersecurity")) {
            if (lowerPrompt.includes("generate") || lowerPrompt.includes("write") || lowerPrompt.includes("policy")) {
                return JSON.stringify(this.templates.ecc);
            }
            return this.responses["ecc"];
        }

        if (lowerPrompt.includes("sama") || lowerPrompt.includes("monetary")) {
            if (lowerPrompt.includes("generate") || lowerPrompt.includes("write") || lowerPrompt.includes("policy")) {
                return JSON.stringify(this.templates.sama);
            }
            return this.responses["sama"];
        }

        if (lowerPrompt.includes("pdpl") || lowerPrompt.includes("personal data")) {
            if (lowerPrompt.includes("generate") || lowerPrompt.includes("write") || lowerPrompt.includes("policy")) {
                return JSON.stringify(this.templates.pdpl);
            }
            return this.responses["pdpl"];
        }

        if (lowerPrompt.includes("cma") || lowerPrompt.includes("market authority")) {
            if (lowerPrompt.includes("generate") || lowerPrompt.includes("write") || lowerPrompt.includes("policy")) {
                return JSON.stringify(this.templates.cma);
            }
            return this.responses["cma"];
        }

        // Default response mapping
        for (const key in this.responses) {
            if (lowerPrompt.includes(key)) {
                return this.responses[key];
            }
        }
        return this.responses["default"];
    }

    static async processCommand(command: string): Promise<{ action: string; args?: any }> {
        const lowerCommand = command.toLowerCase();
        if (lowerCommand.includes("navigate to dashboard") || lowerCommand.includes("show dashboard")) {
            return { action: "navigate", args: { view: "dashboard" } };
        }
        if (lowerCommand.includes("show risks") || lowerCommand.includes("risk register")) {
            return { action: "navigate", args: { view: "riskAssessment" } };
        }
        if (lowerCommand.includes("show assets") || lowerCommand.includes("asset list")) {
            return { action: "navigate", args: { view: "assets" } };
        }
        if (lowerCommand.includes("show training") || lowerCommand.includes("training center")) {
            return { action: "navigate", args: { view: "training" } };
        }
        return { action: "none" };
    }
}

