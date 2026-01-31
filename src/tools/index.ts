import * as vscode from 'vscode';
import { GetTimeTool } from './getTimeTool';
import { PlaywrightInputTool } from './playwrightInputTool';

/**
 * Register all tools for this extension
 * This is called from the main extension.ts activate function
 */
export function registerTools(context: vscode.ExtensionContext) {
    // Register the GetTime tool
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_get_time', new GetTimeTool())
    );

    // Register the Playwright Input tool
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_playwright_input', new PlaywrightInputTool())
    );

    console.log('Tools registered: get_time, playwright_input');
}
