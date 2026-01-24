import * as vscode from 'vscode';
import * as path from 'path';

/**
 * GitHub Repository Download Tool
 * This tool clones a GitHub repository to the user's workspace.
 * It uses VS Code's built-in GitHub authentication and Git extension.
 */

// Interface for tool input parameters
export interface IGitHubCloneParameters {
    repoName: string;      // Format: "owner/repo" (e.g., "microsoft/vscode")
    branch?: string;       // Optional branch name, defaults to main/master
    targetFolder?: string; // Optional target folder name
}

export class GitHubCloneTool implements vscode.LanguageModelTool<IGitHubCloneParameters> {

    /**
     * Called before the tool is invoked to show a confirmation message
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IGitHubCloneParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { repoName, branch } = options.input;

        return {
            invocationMessage: `Cloning ${repoName}${branch ? ` (branch: ${branch})` : ''}...`,
            confirmationMessages: {
                title: 'Clone GitHub Repository',
                message: new vscode.MarkdownString(
                    `Clone repository **${repoName}**${branch ? ` on branch \`${branch}\`` : ''}?\n\n` +
                    `This will download the repository to your workspace.`
                ),
            },
        };
    }

    /**
     * Called when the tool is actually invoked
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IGitHubCloneParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            const result = await this.execute(options.input);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(result)
            ]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`❌ Error cloning repository: ${errorMessage}`)
            ]);
        }
    }

    /**
     * Core logic for cloning a repository
     */
    async execute(input: IGitHubCloneParameters): Promise<string> {
        const { repoName, branch, targetFolder } = input;

        // Validate repo name format
        if (!repoName || !repoName.includes('/')) {
            throw new Error(`Invalid repository name "${repoName}". Please use the format "owner/repo" (e.g., "microsoft/vscode").`);
        }

        // Get the workspace folder to clone into
        const workspaceFolders = vscode.workspace.workspaceFolders;
        let baseDir = '';

        if (!workspaceFolders || workspaceFolders.length === 0) {
            // Ask user to select a folder
            // Note: In an automated MCP server context without UI, this might block or fail if not handled.
            // For now, we assume the environment supports showing this dialog (VS Code Extension Host).
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select folder to clone into'
            });

            if (!folderUri || folderUri.length === 0) {
                return 'Clone cancelled: No folder selected.';
            }
            baseDir = folderUri[0].fsPath;
        } else {
            baseDir = workspaceFolders[0].uri.fsPath;
        }

        // Build the clone URL
        const cloneUrl = `https://github.com/${repoName}.git`;

        // Determine target directory
        const repoShortName = targetFolder || repoName.split('/')[1];
        const targetPath = path.join(baseDir, repoShortName);

        // Execute git clone using VS Code's terminal
        // Note: Terminal activities are UI-bound.
        const terminal = vscode.window.createTerminal({
            name: `Git Clone: ${repoName}`,
            cwd: baseDir
        });

        terminal.sendText(`git clone ${cloneUrl}${branch ? ` --branch ${branch}` : ''} "${repoShortName}"`);
        terminal.show();

        return `✅ Started cloning repository **${repoName}**${branch ? ` (branch: ${branch})` : ''}\n\n` +
            `- Clone URL: ${cloneUrl}\n` +
            `- Target folder: ${targetPath}\n\n` +
            `Check the terminal for progress. Once complete, you can open the folder in VS Code.`;
    }
}
