import * as vscode from 'vscode';

/**
 * A tool to list all available VS Code commands.
 * This allows users to discover command IDs they can use with the runVscodeCommand tool.
 */

export interface IListVscodeCommandsParameters {
    filter?: string;  // Optional filter to search for specific commands
    limit?: number;   // Optional limit on number of results (default: 50)
}

export class ListVscodeCommandsTool implements vscode.LanguageModelTool<IListVscodeCommandsParameters> {

    /**
     * Called before the tool is invoked to show a confirmation message
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IListVscodeCommandsParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { filter } = options.input;
        return {
            invocationMessage: filter
                ? `Listing VS Code commands matching: ${filter}`
                : 'Listing all VS Code commands',
            confirmationMessages: {
                title: 'List VS Code Commands',
                message: new vscode.MarkdownString(
                    filter
                        ? `List commands matching **${filter}**?`
                        : 'List all available VS Code commands?'
                ),
            },
        };
    }

    /**
     * Called when the tool is actually invoked
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IListVscodeCommandsParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const result = await this.execute(options.input);
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(result)
        ]);
    }

    /**
     * Core logic for listing VS Code commands
     */
    async execute(input: IListVscodeCommandsParameters): Promise<string> {
        const { filter, limit = 50 } = input;

        try {
            // Get all available commands
            const allCommands = await vscode.commands.getCommands(true);

            // Filter commands if a filter is provided
            let filteredCommands = allCommands;
            if (filter) {
                const lowerFilter = filter.toLowerCase();
                filteredCommands = allCommands.filter(cmd =>
                    cmd.toLowerCase().includes(lowerFilter)
                );
            }

            // Sort alphabetically
            filteredCommands.sort();

            // Apply limit
            const totalCount = filteredCommands.length;
            const limitedCommands = filteredCommands.slice(0, limit);

            // Format output
            let result = '';
            if (filter) {
                result += `Found ${totalCount} commands matching "${filter}"`;
            } else {
                result += `Found ${totalCount} total commands`;
            }

            if (totalCount > limit) {
                result += ` (showing first ${limit})`;
            }
            result += ':\n\n';

            result += limitedCommands.map(cmd => `- ${cmd}`).join('\n');

            if (totalCount > limit) {
                result += `\n\n... and ${totalCount - limit} more. Use a filter to narrow down results.`;
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Failed to list commands: ${errorMessage}`;
        }
    }
}
