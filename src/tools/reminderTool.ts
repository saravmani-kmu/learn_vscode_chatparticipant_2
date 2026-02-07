import * as vscode from 'vscode';

export interface IReminderParameters {
    interval: string; // e.g., "1m", "30s"
    prompt: string;   // e.g., "Give me a C# interview question"
}

export class ReminderTool implements vscode.LanguageModelTool<IReminderParameters> {
    private activeIntervals: NodeJS.Timeout[] = [];
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel("Remind Me");
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IReminderParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        return {
            invocationMessage: `Setting up reminder every ${options.input.interval}...`,
            confirmationMessages: {
                title: 'Set Reminder',
                message: new vscode.MarkdownString(`Set a reminder every **${options.input.interval}** to ask: _"${options.input.prompt}"_?`),
            },
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IReminderParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const result = await this.execute(options.input);
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(result)
        ]);
    }

    public async execute(input: IReminderParameters): Promise<string> {
        const { interval, prompt } = input;
        const ms = this.parseInterval(interval);

        if (!ms) {
            return `Invalid interval format: ${interval}. Use format like "1m", "30s", "1h".`;
        }

        this.startReminderLoop(ms, prompt);

        return `Reminder set! I will ask "${prompt}" every ${interval}. Check the notifications.`;
    }

    private parseInterval(interval: string): number | null {
        const match = interval.match(/^(\d+)([smh])$/);
        if (!match) return null;

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            default: return null;
        }
    }

    private startReminderLoop(ms: number, prompt: string) {
        // Run immediately
        this.triggerReminder(prompt);

        const timer = setInterval(() => {
            this.triggerReminder(prompt, timer);
        }, ms);

        this.activeIntervals.push(timer);
    }

    private async triggerReminder(prompt: string, timer?: NodeJS.Timeout) {
        try {
            // Select a model (using the default copilot model usually)
            const models = await vscode.lm.selectChatModels({ family: 'gpt-5-mini' }); // Prefer gpt-4 if available, or just take first

            let _selectedmodellist = (await vscode.lm.selectChatModels({}))
            const model = models[0] || (await vscode.lm.selectChatModels({}))[0];

            if (!model) {
                vscode.window.showErrorMessage("No LLM model available to generate reminder content.");
                return;
            }

            const messages = [
                vscode.LanguageModelChatMessage.User(prompt)
            ];

            const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
            let content = '';

            for await (const fragment of response.text) {
                content += fragment;
            }

            // detailed content
            this.outputChannel.appendLine(`--- Reminder: ${prompt} [${new Date().toLocaleTimeString()}] ---`);
            this.outputChannel.appendLine(content);
            this.outputChannel.appendLine(""); // Empty line for spacing
            this.outputChannel.show(true); // Show without taking focus? or take focus

            // Still show a small notification to alert the user
            const action = await vscode.window.showInformationMessage(
                `Reminder: ${prompt}`,
                'View Output',
                'Stop Reminder'
            );

            if (action === 'View Output') {
                this.outputChannel.show();
            } else if (action === 'Stop Reminder' && timer) {
                clearInterval(timer);
                const index = this.activeIntervals.indexOf(timer);
                if (index > -1) {
                    this.activeIntervals.splice(index, 1);
                }
                vscode.window.showInformationMessage("Reminder stopped.");
            }

        } catch (err: any) {
            console.error('Error executing reminder LM request:', err);
            vscode.window.showErrorMessage(`Error getting reminder content: ${err.message}`);
        }
    }
}
