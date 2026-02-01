import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * A "Write To File" tool
 * This tool writes the given text content to a specified file.
 * The LLM can call this tool when the user wants to write content to a file.
 */

// Interface for tool input parameters
export interface IWriteToFileParameters {
    filePath: string;   // Required: the file path to write to
    content: string;    // Required: the content to write
    append?: boolean;   // Optional: if true, append to file instead of overwriting
}

export class WriteToFileTool implements vscode.LanguageModelTool<IWriteToFileParameters> {

    /**
     * Called before the tool is invoked to show a confirmation message
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IWriteToFileParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { filePath, append } = options.input;
        const action = append ? 'Append to' : 'Write to';

        return {
            // Message shown while the tool is running
            invocationMessage: `${action} file: ${filePath}...`,
            // Optional: Customize the confirmation dialog
            confirmationMessages: {
                title: 'Write To File',
                message: new vscode.MarkdownString(`${action} file \`${filePath}\`?`),
            },
        };
    }

    /**
     * Called when the tool is actually invoked
     * This is where the tool does its work
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IWriteToFileParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const result = await this.execute(options.input);

        // Return the result as a LanguageModelToolResult
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(result)
        ]);
    }

    /**
     * Core logic for writing to file, decoupled from the LM tool API
     */
    async execute(input: IWriteToFileParameters): Promise<string> {
        const { filePath, content, append = false } = input;

        try {
            // Resolve the file path
            let resolvedPath = filePath;

            // If relative path, resolve against workspace folder
            if (!path.isAbsolute(filePath)) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    resolvedPath = path.join(workspaceFolders[0].uri.fsPath, filePath);
                }
            }

            // Ensure directory exists
            const dir = path.dirname(resolvedPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write or append to file
            if (append) {
                fs.appendFileSync(resolvedPath, content, 'utf8');
                return `Successfully appended content to file: ${resolvedPath}`;
            } else {
                fs.writeFileSync(resolvedPath, content, 'utf8');
                return `Successfully wrote content to file: ${resolvedPath}`;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Error writing to file: ${errorMessage}`;
        }
    }
}
