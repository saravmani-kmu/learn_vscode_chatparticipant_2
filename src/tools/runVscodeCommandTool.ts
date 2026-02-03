import * as vscode from 'vscode';

/**
 * A tool to execute VS Code commands from the command palette.
 * This allows users to run any VS Code command (like "Checkmarx:: Scan Current File")
 * through the chat interface.
 */

export interface IRunVscodeCommandParameters {
    commandId: string;  // The command ID to execute (e.g., "checkmarx.scanCurrentFile")
    args?: any[];       // Optional arguments to pass to the command
}

export class RunVscodeCommandTool implements vscode.LanguageModelTool<IRunVscodeCommandParameters> {

    /**
     * Called before the tool is invoked to show a confirmation message
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IRunVscodeCommandParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { commandId } = options.input;
        return {
            invocationMessage: `Executing VS Code command: ${commandId}`,
            confirmationMessages: {
                title: 'Run VS Code Command',
                message: new vscode.MarkdownString(`Execute command **${commandId}**?`),
            },
        };
    }

    /**
     * Called when the tool is actually invoked
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IRunVscodeCommandParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const result = await this.execute(options.input);
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(result)
        ]);
    }

    /**
     * Core logic for executing the VS Code command
     */
    async execute(input: IRunVscodeCommandParameters): Promise<string> {
        const { commandId, args } = input;

        try {
            // Get all available commands to validate
            const allCommands = await vscode.commands.getCommands(true);

            // Check if the command exists
            if (!allCommands.includes(commandId)) {
                // Try to find similar commands for suggestions
                const suggestions = allCommands
                    .filter(cmd => cmd.toLowerCase().includes(commandId.toLowerCase().split('.')[0] || commandId.toLowerCase()))
                    .slice(0, 5);

                let errorMessage = `Command '${commandId}' not found.`;
                if (suggestions.length > 0) {
                    errorMessage += `\n\nDid you mean one of these?\n${suggestions.map(s => `- ${s}`).join('\n')}`;
                }
                return errorMessage;
            }

            // Execute the command
            if (args && args.length > 0) {
                await vscode.commands.executeCommand(commandId, ...args);
            } else {
                await vscode.commands.executeCommand(commandId);
            }

            return `Successfully executed VS Code command: ${commandId}`;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Failed to execute command '${commandId}': ${errorMessage}`;
        }
    }

    /**
     * Static helper method to list all available commands matching a filter
     */
    static async listCommands(filter?: string): Promise<string[]> {
        const allCommands = await vscode.commands.getCommands(true);
        if (filter) {
            return allCommands.filter(cmd =>
                cmd.toLowerCase().includes(filter.toLowerCase())
            );
        }
        return allCommands;
    }
}
