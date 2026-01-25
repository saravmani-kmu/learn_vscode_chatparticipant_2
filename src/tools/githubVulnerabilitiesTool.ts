
import * as vscode from 'vscode';

export interface IGitHubVulnerabilitiesParameters {
    owner?: string;
    repo?: string;
    branch?: string;
}

interface Alert {
    number: number;
    rule: {
        id: string;
        severity: string;
        description: string;
    };
    created_at: string;
    state: string;
    html_url: string;
}

export class GitHubVulnerabilitiesTool implements vscode.LanguageModelTool<IGitHubVulnerabilitiesParameters> {

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IGitHubVulnerabilitiesParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        let { owner, repo, branch } = options.input;

        if (!owner || !repo || !branch) {
            const context = await this.getGitHubContext();
            if (context) {
                owner = owner || context.owner;
                repo = repo || context.repo;
                branch = branch || context.branch;
            }
        }

        const repoString = (owner && repo) ? `${owner}/${repo}` : 'current repository';
        const branchString = branch ? ` on branch '${branch}'` : '';

        return {
            invocationMessage: `Checking vulnerabilities for ${repoString}${branchString}...`,
            confirmationMessages: {
                title: 'Check GitHub Vulnerabilities',
                message: new vscode.MarkdownString(`Check for code scanning alerts in **${repoString}**${branchString}?`),
            },
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IGitHubVulnerabilitiesParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        try {
            const result = await this.execute(options.input);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(result)
            ]);
        } catch (error: any) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`❌ Error checking vulnerabilities: ${error.message}`)
            ]);
        }
    }

    async execute(input: IGitHubVulnerabilitiesParameters): Promise<string> {
        let { owner, repo, branch } = input;

        // Auto-detect context if missing
        if (!owner || !repo || !branch) {
            const context = await this.getGitHubContext();
            if (!context) {
                if (!owner || !repo) throw new Error("Could not determine repository context. Please provide owner and repo.");
                if (!branch) throw new Error("Could not determine current branch. Please provide branch name.");
            } else {
                owner = owner || context.owner;
                repo = repo || context.repo;
                branch = branch || context.branch;
            }
        }

        // Get Authentication Token
        const session = await vscode.authentication.getSession('github', ['repo', 'security_events'], { createIfNone: true });
        if (!session) {
            throw new Error("Authentication failed. Please sign in to GitHub.");
        }

        // Fetch Alerts
        const alerts = await this.fetchAlerts(owner!, repo!, branch!, session.accessToken);

        if (alerts.length === 0) {
            return `✅ No open code scanning alerts found for **${owner}/${repo}** on branch \`${branch}\`.`;
        }

        let report = `⚠️ Found **${alerts.length}** open code scanning alerts for **${owner}/${repo}** on branch \`${branch}\`:\n\n`;

        for (const alert of alerts.slice(0, 5)) { // Limit to top 5
            report += `- [${alert.rule.severity.toUpperCase()}] **${alert.rule.description}** (Rule ID: ${alert.rule.id})\n`;
            report += `  - URL: ${alert.html_url}\n`;
            report += `  - Created: ${new Date(alert.created_at).toLocaleDateString()}\n\n`;
        }

        if (alerts.length > 5) {
            report += `... and ${alerts.length - 5} more. Check the GitHub repository for full details.`;
        }

        return report;
    }

    private async getGitHubContext(): Promise<{ owner: string; repo: string; branch: string } | undefined> {
        try {
            const extension = vscode.extensions.getExtension('vscode.git');
            if (!extension) return undefined;

            const git = extension.exports.getAPI(1);
            const repository = git.repositories[0];

            if (!repository) return undefined;

            const branch = repository.state.HEAD?.name;
            const remote = repository.state.remotes.find((r: any) => r.name === 'origin') || repository.state.remotes[0];
            const fetchUrl = remote?.fetchUrl;

            if (!branch || !fetchUrl) return undefined;

            // Extract owner and repo from URL (supports https and ssh)
            // https://github.com/owner/repo.git
            // git@github.com:owner/repo.git
            const match = fetchUrl.match(/github\.com[:/]([^\/]+)\/([^\.]+)/);
            if (match) {
                return {
                    owner: match[1],
                    repo: match[2],
                    branch: branch
                };
            }
        } catch (e) {
            console.error("Failed to detect GitHub context", e);
        }
        return undefined;
    }

    private async fetchAlerts(owner: string, repo: string, branch: string, token: string): Promise<Alert[]> {
        // API: https://docs.github.com/en/rest/code-scanning/code-scanning?apiVersion=2022-11-28#list-code-scanning-alerts-for-a-repository
        // ref: The Git reference for the alerts, as a 1-based index. (Actually it's a ref string like refs/heads/main)

        const url = `https://api.github.com/repos/${owner}/${repo}/code-scanning/alerts?ref=refs/heads/${branch}&state=open`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'VSCode-Chat-Participant'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            if (response.status === 404) {
                // Code scanning might not be set up
                throw new Error(`Code scanning / Advanced Security not enabled or found for ${owner}/${repo}.`);
            }
            if (response.status === 403) {
                throw new Error(`Access denied. Ensure the token has 'security_events' scope and you have permission.`);
            }
            throw new Error(`GitHub API Error (${response.status}): ${text}`);
        }

        return await response.json() as Alert[];
    }
}
