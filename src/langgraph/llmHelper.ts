/**
 * LLM Helper - Provides LLM access using VS Code's Language Model API
 * Used by all agents for intelligent decision making and text processing
 */

import * as vscode from 'vscode';

// Store the model reference for reuse
let cachedModel: vscode.LanguageModelChat | undefined;

/**
 * Get or select a language model
 */
export async function getLanguageModel(): Promise<vscode.LanguageModelChat> {
    if (cachedModel) {
        return cachedModel;
    }

    // Select available chat models (prefer GPT-4 family)
    const models = await vscode.lm.selectChatModels({
        vendor: 'copilot',
        family: 'gpt-4o'
    });

    if (models.length === 0) {
        // Fallback to any available model
        const allModels = await vscode.lm.selectChatModels();
        if (allModels.length === 0) {
            throw new Error('No language models available. Ensure GitHub Copilot is installed and authenticated.');
        }
        cachedModel = allModels[0];
    } else {
        cachedModel = models[0];
    }

    return cachedModel;
}

/**
 * Call LLM with a prompt and system message
 */
export async function callLLM(
    userPrompt: string,
    systemMessage: string,
    token?: vscode.CancellationToken
): Promise<string> {
    const model = await getLanguageModel();

    const messages = [
        vscode.LanguageModelChatMessage.User(systemMessage + "\n\n" + userPrompt)
    ];

    const response = await model.sendRequest(messages, {}, token ?? new vscode.CancellationTokenSource().token);

    // Collect the streamed response
    let result = '';
    for await (const chunk of response.text) {
        result += chunk;
    }

    return result;
}

/**
 * Call LLM to analyze which agents to invoke based on user query
 */
export async function analyzeQueryForRouting(
    query: string,
    token?: vscode.CancellationToken
): Promise<("tci" | "itracker" | "scanissues")[]> {
    const systemMessage = `You are a task routing assistant. Analyze the user query and decide which agents to invoke.

Available agents:
- tci: For Technical Compliance Items, audits, certificates, compliance requirements
- itracker: For issue tracking, bugs, features, tasks, documentation
- scanissues: For security scan results, vulnerabilities, CVEs, SAST/DAST findings, Checkmarx issues

Respond with ONLY a JSON array of agent names. Examples:
- ["tci"] - for TCI/compliance queries
- ["itracker"] - for issue tracking queries  
- ["scanissues"] - for security scan/vulnerability queries
- ["tci", "itracker", "scanissues"] - for queries that need all

Do not include any other text, only the JSON array.`;

    const result = await callLLM(query, systemMessage, token);

    try {
        // Parse the JSON response
        const agents = JSON.parse(result.trim());
        if (Array.isArray(agents)) {
            return agents.filter(a => a === "tci" || a === "itracker" || a === "scanissues") as ("tci" | "itracker" | "scanissues")[];
        }
    } catch {
        console.error('Failed to parse LLM routing response:', result);
    }

    // Default to all if parsing fails
    return ["tci", "itracker", "scanissues"];
}

/**
 * Call LLM to extract CSV data from HTML table
 */
export async function extractCSVFromHTML(
    html: string,
    sourceType: "tci" | "itracker" | "scanissues",
    appId: string,
    token?: vscode.CancellationToken
): Promise<string> {
    const systemMessage = `You are a data extraction assistant. Extract task items from the HTML table and convert to CSV format.

Required CSV columns: App_id,Task_Type,Task_SubType,Task,DueDate,Parent_JIRA,JIRA,Status,MoreDetails

Rules:
- Use "${appId}" for App_id
- Extract values from the HTML table rows
- Leave columns empty if data is not available in the HTML
- Do NOT include the header row in output, just the data rows
- Output ONLY the CSV data, no explanations

Example output format:
${appId},Security,Vulnerability,Update encryption,2026-03-15,SEC-123,JIRA-456,Open,Details here`;

    const result = await callLLM(`Extract CSV from this ${sourceType.toUpperCase()} HTML:\n\n${html}`, systemMessage, token);

    return result.trim();
}

/**
 * Call LLM to summarize task items
 */
export async function summarizeResults(
    tciResponse: string | undefined,
    iTrackerResponse: string | undefined,
    scanIssuesResponse: string | undefined,
    query: string,
    token?: vscode.CancellationToken
): Promise<string> {
    const systemMessage = `You are a helpful assistant. Summarize the collected task items in a concise, user-friendly format.

Include:
- Total count of items found
- Brief categorization by type
- Any urgent items (upcoming due dates or critical status)
- Key highlights

Be concise but informative. Use markdown formatting.`;

    const content = `
User Query: ${query}

TCI Results:
${tciResponse || "No TCI items found"}

iTracker Results:
${iTrackerResponse || "No iTracker items found"}

ScanIssues Results:
${scanIssuesResponse || "No scan issues found"}
`;

    const result = await callLLM(content, systemMessage, token);
    return result;
}

/**
 * Clear cached model (useful for testing or reconnection)
 */
export function clearModelCache(): void {
    cachedModel = undefined;
}
