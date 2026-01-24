import * as vscode from 'vscode';

/**
 * A simple "Get Current Time" tool
 * This tool demonstrates the basic structure of a VS Code language model tool.
 * The LLM can call this tool when the user asks about the current time.
 */

// Interface for tool input parameters (even if empty, good practice to define)
export interface IGetTimeParameters {
    timezone?: string;  // Optional: timezone to get time for
}

export class GetTimeTool implements vscode.LanguageModelTool<IGetTimeParameters> {

    /**
     * Called before the tool is invoked to show a confirmation message
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IGetTimeParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        return {
            // Message shown while the tool is running
            invocationMessage: 'Getting current time...',
            // Optional: Customize the confirmation dialog
            confirmationMessages: {
                title: 'Get Current Time',
                message: new vscode.MarkdownString('Get the current date and time?'),
            },
        };
    }

    /**
     * Called when the tool is actually invoked
     * This is where the tool does its work
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IGetTimeParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const result = await this.execute(options.input);

        // Return the result as a LanguageModelToolResult
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(result)
        ]);
    }

    /**
     * Core logic for getting the time, decoupled from the LM tool API
     */
    async execute(input: IGetTimeParameters): Promise<string> {
        const now = new Date();

        // Format the date and time nicely
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return `The current date is ${dateStr} and the time is ${timeStr}.`;
    }
}
