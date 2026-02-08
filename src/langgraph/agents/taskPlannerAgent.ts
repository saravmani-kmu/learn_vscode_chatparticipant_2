/**
 * Task Planner Agent - Orchestrates which agents to invoke based on user query
 * Uses LLM to analyze query and decide routing
 * Also handles final summarization of results using LLM
 */

import { AgentState } from "../state";
import { analyzeQueryForRouting, summarizeResults } from "../llmHelper";
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
 * Task Planner node - uses LLM to analyze query and decide routing
 */
export async function taskPlannerNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("[Task Planner] Analyzing query with LLM:", state.userQuery);

    try {
        // Use LLM to analyze the query and decide which agents to invoke
        const agentsToInvoke = await analyzeQueryForRouting(state.userQuery, currentToken);
        console.log("[Task Planner] LLM decided to invoke agents:", agentsToInvoke);

        return {
            agentsToInvoke,
        };
    } catch (error) {
        console.error("[Task Planner] LLM call failed, using fallback logic:", error);
        // Fallback to keyword-based routing
        return {
            agentsToInvoke: fallbackAnalyzeQuery(state.userQuery),
        };
    }
}

/**
 * Fallback query analysis when LLM is not available
 */
function fallbackAnalyzeQuery(query: string): ("tci" | "itracker" | "scanissues")[] {
    const lowerQuery = query.toLowerCase();
    const agents: ("tci" | "itracker" | "scanissues")[] = [];

    const tciKeywords = ["tci", "compliance", "technical compliance", "certificate"];
    const hasTCI = tciKeywords.some(keyword => lowerQuery.includes(keyword));

    const iTrackerKeywords = ["itracker", "tracker", "issue", "bug", "feature", "task"];
    const hasITracker = iTrackerKeywords.some(keyword => lowerQuery.includes(keyword));

    const scanKeywords = ["scan", "security scan", "vulnerability", "vulnerabilities", "checkmarx", "sast", "dast", "cve"];
    const hasScan = scanKeywords.some(keyword => lowerQuery.includes(keyword));

    const allKeywords = ["all", "everything", "complete", "full"];
    const wantsAll = allKeywords.some(keyword => lowerQuery.includes(keyword));

    if (wantsAll) {
        return ["tci", "itracker", "scanissues"];
    }

    if (hasTCI) agents.push("tci");
    if (hasITracker) agents.push("itracker");
    if (hasScan) agents.push("scanissues");

    return agents.length > 0 ? agents : ["tci", "itracker", "scanissues"];
}

/**
 * Summarizer node - uses LLM to summarize results from all invoked agents
 */
export async function summarizerNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("[Summarizer] Creating LLM-powered summary");

    const allItems = [
        ...(state.tciItems || []),
        ...(state.iTrackerItems || []),
        ...(state.scanIssuesItems || [])
    ];

    try {
        // Use LLM to create a natural language summary
        const finalSummary = await summarizeResults(
            state.tciResponse,
            state.iTrackerResponse,
            state.scanIssuesResponse,
            state.userQuery,
            currentToken
        );

        console.log("[Summarizer] LLM summary generated");

        return {
            finalSummary,
            allItems,
        };
    } catch (error) {
        console.error("[Summarizer] LLM call failed, using fallback:", error);
        // Fallback summary
        return {
            finalSummary: createFallbackSummary(state, allItems.length),
            allItems,
        };
    }
}

/**
 * Fallback summary when LLM is not available
 */
function createFallbackSummary(state: AgentState, totalItems: number): string {
    const parts: string[] = [];
    parts.push("## Task Planner Summary\n");
    parts.push(`**Query:** ${state.userQuery}`);
    parts.push(`**App ID:** ${state.appId}`);
    parts.push(`**Agents invoked:** ${state.agentsToInvoke.join(", ")}\n`);

    if (state.tciResponse) {
        parts.push("### TCI Results");
        parts.push(state.tciResponse);
    }

    if (state.iTrackerResponse) {
        parts.push("### iTracker Results");
        parts.push(state.iTrackerResponse);
    }

    if (state.scanIssuesResponse) {
        parts.push("### ScanIssues Results");
        parts.push(state.scanIssuesResponse);
    }

    parts.push(`\n**Total items:** ${totalItems}`);
    parts.push("All items have been stored to `task_items.csv`");

    return parts.join("\n");
}
