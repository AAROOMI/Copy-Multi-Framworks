
export class LocalLLM {
    private static responses: Record<string, string> = {
        "hello": "Hello! I am your local compliance assistant. I'm operating in offline mode.",
        "status": "System status is stable. All local data is synchronized.",
        "compliance": "Your overall compliance score is currently being calculated from local cache.",
        "help": "I can help you navigate the application, check compliance scores, and manage risks even when offline.",
        "default": "I'm currently in offline mode. I can still help with basic navigation and data viewing, but complex reasoning requires a connection."
    };

    private static templates: Record<string, any> = {
        "policy": {
            "policy": "# Cyber Security Policy\nThis policy outlines the security measures for your organization.",
            "procedure": "## Procedures\n1. Conduct regular checks.\n2. Update systems weekly.",
            "guideline": "### Guidelines\nFollow industry best practices for data protection."
        }
    };

    static async generateResponse(prompt: string): Promise<string> {
        const lowerPrompt = prompt.toLowerCase();
        
        // If it looks like a document generation request
        if (lowerPrompt.includes("generate") && (lowerPrompt.includes("policy") || lowerPrompt.includes("json"))) {
            return JSON.stringify(this.templates.policy);
        }

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
        return { action: "none" };
    }
}
