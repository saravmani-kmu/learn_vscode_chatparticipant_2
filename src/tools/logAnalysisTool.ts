
import * as vscode from 'vscode';

export interface ILogAnalysisParameters {
    channelName: string; // The Output Channel name to subscribe to (e.g., "Checkmarx", "Git")
    prompt?: string;     // Instructions for analysis (e.g., "Summarize security issues")
}

export class LogAnalysisTool implements vscode.LanguageModelTool<ILogAnalysisParameters> {
    private static activeListeners: vscode.Disposable[] = [];
    private static outputChannel: vscode.OutputChannel | undefined;

    constructor() {
        if (!LogAnalysisTool.outputChannel) {
            LogAnalysisTool.outputChannel = vscode.window.createOutputChannel("Log Analysis Results");
        }
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<ILogAnalysisParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        return {
            invocationMessage: `Setting up listener for output channel "${options.input.channelName}"...`,
            confirmationMessages: {
                title: 'Start Log Analysis',
                message: new vscode.MarkdownString(`Subscribe to output channel "**${options.input.channelName}**" and analyze new messages?`),
            },
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<ILogAnalysisParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const result = await this.execute(options.input);

        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(result)
        ]);
    }

    public async execute(input: ILogAnalysisParameters): Promise<string> {
        const { channelName, prompt } = input;

        // Clear previous listeners to avoid duplicates (optional, or manage multiple)
        // For simplicity, let's allow multiple listeners but maybe warn.
        // Or store them map<channelName, disposable>.
        // Let's keep it simple: just register a new one.

        const listener = vscode.workspace.onDidChangeTextDocument(async (e) => {
            // Check if this document matches the channel name
            // Output channels have scheme 'output'
            if (e.document.uri.scheme === 'output' && e.document.fileName.includes(channelName)) {
                // Get the changed content
                // Reading the full content is expensive potentially, but usually incremental.
                // e.contentChanges gives the changes.

                const newContent = e.contentChanges.map(c => c.text).join('');
                if (!newContent.trim()) return;

                // Process with LLM
                this.analyzeContent(newContent, prompt || "Analyze this log entry:");
            }
        });

        LogAnalysisTool.activeListeners.push(listener);

        return `Started monitoring output channel matching "${channelName}".
New messages will be analyzed and shown in the "Log Analysis Results" output channel.
Please ensure the target Output Channel is OPEN/VISIBLE in the panel for monitoring to work.`;
    }

    private async analyzeContent(content: string, userPrompt: string) {
        try {
            // Select a model
            const models = await vscode.lm.selectChatModels({ family: 'gpt-5-mini' });
            const model = models[0] || (await vscode.lm.selectChatModels({}))[0];

            if (!model) {
                LogAnalysisTool.outputChannel?.appendLine(`[Error] No LLM model available.`);
                return;
            }

            const messages = [
                vscode.LanguageModelChatMessage.User(`${userPrompt}\n\nLog Content:\n${content}`)
            ];

            const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
            let analysis = '';

            for await (const fragment of response.text) {
                analysis += fragment;
            }

            // Log result
            if (LogAnalysisTool.outputChannel) {
                LogAnalysisTool.outputChannel.appendLine(`--- Analysis [${new Date().toLocaleTimeString()}] ---`);
                LogAnalysisTool.outputChannel.appendLine(`Source Content: ${content.substring(0, 100).replace(/\n/g, ' ')}...`);
                LogAnalysisTool.outputChannel.appendLine(`Analysis: ${analysis}`);
                LogAnalysisTool.outputChannel.appendLine('');
                LogAnalysisTool.outputChannel.show(true);
            }

            // Optional: Show forceful notification for critical issues?
            // Maybe if analysis contains "Critical" or "Error".
            if (analysis.toLowerCase().includes('critical') || analysis.toLowerCase().includes('vulnerability')) {
                vscode.window.showInformationMessage(`Log Analysis Alert: ${analysis.substring(0, 100)}...`, "View Details")
                    .then(selection => {
                        if (selection === "View Details") {
                            LogAnalysisTool.outputChannel?.show();
                        }
                    });
            }

        } catch (err: any) {
            console.error('Error analyzing log:', err);
            LogAnalysisTool.outputChannel?.appendLine(`[Error Analyzing]: ${err.message}`);
        }
    }

    public static dispose() {
        LogAnalysisTool.activeListeners.forEach(d => d.dispose());
        LogAnalysisTool.activeListeners = [];
    }
}
