
import * as vscode from 'vscode';

export interface IRunTerminalCommandParameters {
    command: string;
    name?: string;
}

export class RunTerminalCommandTool implements vscode.LanguageModelTool<IRunTerminalCommandParameters> {

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IRunTerminalCommandParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { command, name } = options.input;
        return {
            invocationMessage: `Executing command: ${command}`,
            confirmationMessages: {
                title: 'Run Terminal Command',
                message: new vscode.MarkdownString(`Run command **${command}** in terminal${name ? ` '${name}'` : ''}?`),
            },
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IRunTerminalCommandParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const result = await this.execute(options.input);
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(result)
        ]);
    }

    async execute(input: IRunTerminalCommandParameters): Promise<string> {
        const { command, name } = input;

        // Create or reuse terminal
        // Note: For simplicity, we always create a new one or find one with the exact name if provided.
        // In a real scenario, we might want to be smarter about reusing terminals.
        let terminal = vscode.window.terminals.find(t => t.name === (name || "MCP Terminal"));

        if (!terminal) {
            terminal = vscode.window.createTerminal({
                name: name || "MCP Terminal"
            });
        }

        terminal.show();
        terminal.sendText(command);

        return `Command sent to terminal '${terminal.name}': ${command}`;
    }
}
