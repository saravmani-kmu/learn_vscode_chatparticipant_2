/**
 * ScanIssues Agent - Fetches scan issues, uses LLM to parse HTML to TaskItems, and stores them
 */

import { AgentState, TaskItem } from "../state";
import { fetchScanIssues } from "../tools/fetchScanIssuesTool";
import { storeTaskItems, taskItemsToCSVString } from "../tools/storeTaskItemsTool";
import { extractCSVFromHTML } from "../llmHelper";
import * as vscode from 'vscode';

// Store cancellation token for LLM calls
let currentToken: vscode.CancellationToken | undefined;

/**
 * Set the cancellation token for LLM calls
 */
export function setLLMCancellationToken(token: vscode.CancellationToken): void {
    currentToken = token;
}

/**
 * Parse CSV string to TaskItem array
 */
function parseCSVToTaskItems(csv: string, appId: string): TaskItem[] {
    const items: TaskItem[] = [];
    const lines = csv.split('\n').filter(line => line.trim());

    for (const line of lines) {
        const values = parseCSVLine(line);
        if (values.length >= 1) {
            items.push({
                App_id: values[0] || appId,
                Task_Type: values[1] || "",
                Task_SubType: values[2] || "",
                Task: values[3] || "",
                DueDate: values[4] || "",
                Parent_JIRA: values[5] || "",
                JIRA: values[6] || "",
                Status: values[7] || "",
                MoreDetails: values[8] || "",
            });
        }
    }

    return items;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

/**
 * Fallback HTML to TaskItems parser (regex-based)
 */
function fallbackParseHTMLToTaskItems(html: string, appId: string): TaskItem[] {
    const items: TaskItem[] = [];
    const rowRegex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/gs;

    let match;
    while ((match = rowRegex.exec(html)) !== null) {
        items.push({
            App_id: appId,
            Task_Type: match[1].trim(),
            Task_SubType: match[2].trim(),
            Task: match[3].trim(),
            DueDate: match[4].trim(),
            Parent_JIRA: "",
            JIRA: match[5].trim(),
            Status: match[6].trim(),
            MoreDetails: match[7].trim(),
        });
    }

    return items;
}

/**
 * ScanIssues Agent node function for LangGraph - uses LLM for HTML to CSV conversion
 */
export async function scanIssuesAgentNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("[ScanIssues Agent] Starting to fetch scan issues for app:", state.appId);

    // Step 1: Fetch Scan Issues HTML
    const htmlContent = fetchScanIssues(state.appId);
    console.log("[ScanIssues Agent] Fetched HTML content");

    let scanIssuesItems: TaskItem[];

    try {
        // Step 2: Use LLM to extract CSV from HTML
        console.log("[ScanIssues Agent] Using LLM to extract CSV from HTML");
        const csvData = await extractCSVFromHTML(htmlContent, "scanissues" as any, state.appId, currentToken);

        // Step 3: Parse CSV to TaskItems
        scanIssuesItems = parseCSVToTaskItems(csvData, state.appId);
        console.log(`[ScanIssues Agent] LLM extracted ${scanIssuesItems.length} scan issues`);
    } catch (error) {
        console.error("[ScanIssues Agent] LLM extraction failed, using fallback:", error);
        scanIssuesItems = fallbackParseHTMLToTaskItems(htmlContent, state.appId);
        console.log(`[ScanIssues Agent] Fallback extracted ${scanIssuesItems.length} scan issues`);
    }

    // Step 4: Store items to CSV
    const result = storeTaskItems(scanIssuesItems);
    console.log(`[ScanIssues Agent] Stored items - Added: ${result.added}, Updated: ${result.updated}`);

    // Step 5: Generate CSV response
    const csvResponse = taskItemsToCSVString(scanIssuesItems);

    return {
        scanIssuesItems,
        scanIssuesResponse: `**ScanIssues Agent:** Found ${scanIssuesItems.length} security scan issues.\n\n\`\`\`csv\n${csvResponse}\n\`\`\``,
    };
}
