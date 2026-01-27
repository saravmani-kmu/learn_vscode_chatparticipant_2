import { z } from "zod";

export class JiraTool {
    async execute(args: any): Promise<string> {
        const { jiraUrl, email, apiToken, projectKey } = args;

        if (!jiraUrl || !email || !apiToken) {
            throw new Error("Missing required arguments: jiraUrl, email, or apiToken");
        }

        // Basic validation of URL
        let validUrl: URL;
        try {
            validUrl = new URL(jiraUrl);
        } catch (e) {
            throw new Error("Invalid jiraUrl");
        }

        // Construct JQL
        let jql = "order by created DESC";
        if (projectKey) {
            jql = `project = "${projectKey}" ${jql}`;
        }

        const searchUrl = new URL("/rest/api/3/search", validUrl);
        searchUrl.searchParams.append("jql", jql);
        searchUrl.searchParams.append("fields", "key,summary,status");
        searchUrl.searchParams.append("maxResults", "10");

        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

        try {
            const response = await fetch(searchUrl.toString(), {
                method: "GET",
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`JIRA API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json() as any;

            if (!data.issues || !Array.isArray(data.issues)) {
                return "No issues found or invalid response format.";
            }

            const issues = data.issues.map((issue: any) => {
                const key = issue.key;
                const summary = issue.fields?.summary || "No summary";
                const status = issue.fields?.status?.name || "Unknown status";
                return `- [${key}] ${summary} (${status})`;
            });

            return `Found ${data.total} issues (showing top ${issues.length}):\n${issues.join("\n")}`;

        } catch (error: any) {
            throw new Error(`Failed to fetch JIRA issues: ${error.message}`);
        }
    }
}
