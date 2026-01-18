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
        const { repoName, branch, targetFolder } = options.input;

        // Validate repo name format
        if (!repoName || !repoName.includes('/')) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Error: Invalid repository name "${repoName}". Please use the format "owner/repo" (e.g., "microsoft/vscode").`
                )
            ]);
        }

        try {
            // Get the workspace folder to clone into
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                // Ask user to select a folder
                const folderUri = await vscode.window.showOpenDialog({
                    canSelectFolders: true,
                    canSelectFiles: false,
                    canSelectMany: false,
                    openLabel: 'Select folder to clone into'
                });

                if (!folderUri || folderUri.length === 0) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart('Clone cancelled: No folder selected.')
                    ]);
                }
            }

            // Build the clone URL
            const cloneUrl = `https://github.com/${repoName}.git`;

            // Determine target directory
            const repoShortName = targetFolder || repoName.split('/')[1];
            const baseDir = workspaceFolders?.[0]?.uri.fsPath || '';
            const targetPath = path.join(baseDir, repoShortName);

            // Build git clone command arguments
            const args = ['clone', cloneUrl];branch
            if (branch) {
                args.push('--branch', );
            }
            args.push(targetPath);

            // Execute git clone using VS Code's terminal or command
            const terminal = vscode.window.createTerminal({
                name: `Git Clone: ${repoName}`,
                cwd: baseDir
            });

            terminal.sendText(`git clone ${cloneUrl}${branch ? ` --branch ${branch}` : ''} "${repoShortName}"`);
            terminal.show();

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `✅ Started cloning repository **${repoName}**${branch ? ` (branch: ${branch})` : ''}\n\n` +
                    `- Clone URL: ${cloneUrl}\n` +
                    `- Target folder: ${targetPath}\n\n` +
                    `Check the terminal for progress. Once complete, you can open the folder in VS Code.`
                )
            ]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`❌ Error cloning repository: ${errorMessage}`)
            ]);
        }
    }
}
