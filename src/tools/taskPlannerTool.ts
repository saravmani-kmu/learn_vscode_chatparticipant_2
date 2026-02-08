/**
 * Task Planner Tool - VS Code Language Model Tool wrapper for LangGraph workflow
 * Exposes the multi-agent task planner to Copilot Chat
 */

import * as vscode from 'vscode';
import { runWorkflow } from '../langgraph/workflow';
import { setLLMCancellationToken as setTaskPlannerToken } from '../langgraph/agents/taskPlannerAgent';
import { setLLMCancellationToken as setTCIToken } from '../langgraph/agents/tciAgent';
import { setLLMCancellationToken as setITrackerToken } from '../langgraph/agents/iTrackerAgent';
import { setLLMCancellationToken as setScanIssuesToken } from '../langgraph/agents/scanIssuesAgent';

/**
 * Input schema for the TaskPlanner tool
 */
interface TaskPlannerInput {
    query: string;
    appId?: string;
}

/**
 * TaskPlannerTool class - implements vscode.LanguageModelTool
 */
export class TaskPlannerTool implements vscode.LanguageModelTool<TaskPlannerInput> {

    /**
     * Invoke the multi-agent task planner workflow
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<TaskPlannerInput>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { query, appId = "APP-001" } = options.input;

        console.log(`[TaskPlannerTool] Invoked with query: "${query}", appId: "${appId}"`);

        // Set the cancellation token for all agents
        setTaskPlannerToken(token);
        setTCIToken(token);
        setITrackerToken(token);
        setScanIssuesToken(token);

        try {
            // Run the LangGraph workflow
            const result = await runWorkflow(query, appId);

            // Return the summary as the tool result
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(result.finalSummary || "No results found.")
            ]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[TaskPlannerTool] Workflow error:', errorMessage);

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error running task planner: ${errorMessage}`)
            ]);
        }
    }

    /**
     * Prepare invocation - shows confirmation UI to user
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationOptions<TaskPlannerInput>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { query, appId = "APP-001" } = options.input;

        return {
            invocationMessage: `Running task planner for "${query}" on app ${appId}...`,
        };
    }
}

/**
 * Register the TaskPlanner tool with VS Code
 */
export function registerTaskPlannerTool(context: vscode.ExtensionContext): void {
    const tool = new TaskPlannerTool();

    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_task_planner', tool)
    );

    console.log('[TaskPlannerTool] Registered successfully');
}
