
import * as vscode from 'vscode';
import { CheckmarxScanUtil } from './utils/checkmarxutil';
import { CheckmarxAuthService } from './utils/checkmarxauth';
import * as path from 'path';

export interface ICheckmarxScanParameters {
    folderPath: string; // Absolute path to scan
    projectName?: string; // Optional project name
    teamId?: string; // Required if not defaulted.
    baseUrl?: string; // Optional, to trigger login if needed
}

export class CheckmarxScanTool implements vscode.LanguageModelTool<ICheckmarxScanParameters> {
    private scanUtil: CheckmarxScanUtil;
    private authService: CheckmarxAuthService;

    constructor(private context: vscode.ExtensionContext) {
        this.scanUtil = new CheckmarxScanUtil(context);
        this.authService = new CheckmarxAuthService(context);
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<ICheckmarxScanParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        return {
            invocationMessage: `Scanning folder "${options.input.folderPath}" with Checkmarx...`,
            confirmationMessages: {
                title: 'Start Checkmarx Scan',
                message: new vscode.MarkdownString(`Start a Checkmarx code scan for folder **${options.input.folderPath}**?`),
            },
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<ICheckmarxScanParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const result = await this.execute(options.input);

        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(result)
        ]);
    }

    public async execute(input: ICheckmarxScanParameters): Promise<string> {
        const { folderPath, projectName, teamId, baseUrl } = input;

        // 1. Check/Ensure Auth
        let token = await this.authService.getToken('cx_access_token');
        let storedBaseUrl = this.authService.getBaseUrl();

        if (!token || !storedBaseUrl) {
            if (baseUrl) {
                // Try to login if baseUrl is provided
                // Note: login() opens browser, so we can't fully automate it in background without interaction.
                // But we can initiate it.
                await this.authService.login(baseUrl);
                return "Use the browser window to complete login, then try running the scan command again.";
            } else {
                return "Not logged in to Checkmarx. Please provide 'baseUrl' parameter or login manually first.";
            }
        }

        // 2. Validate folder
        // (Assuming folder exists for now, util handles errors)

        // 3. Defaults
        const finalProjectName = projectName || path.basename(folderPath); // Default to folder name
        const finalTeamId = teamId || "1"; // Default Team ID? Or error. Let's default to "1" (CxServer root usually) or require user input.
        // Better: require teamId if not known. But for smooth demo, maybe default 1.

        if (!teamId) {
            // Ideally we should list teams, but we don't have that util exposed yet.
            // We'll proceed with "1" and if it fails, user sees error.
            // Or return message asking for teamId.
        }

        // 4. Trigger Scan
        try {
            // Note: triggerScan is void promise, it shows messages. 
            // We should catch errors here or let util handle it.
            // Util handles errors with showErrorMessage.

            // We can return message saying scan initiated.
            this.scanUtil.triggerScan(folderPath, finalProjectName, finalTeamId || "1");

            return `Checkmarx scan initiated for project "${finalProjectName}" (Team ID: ${finalTeamId || "1"}). Check notifications/output for scan ID and status.`;
        } catch (error: any) {
            return `Failed to initiate scan: ${error.message}`;
        }
    }
}
