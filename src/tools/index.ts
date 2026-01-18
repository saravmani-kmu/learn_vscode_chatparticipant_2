import * as vscode from 'vscode';
import { GetTimeTool } from './getTimeTool';

/**
 * Register all tools for this extension
 * This is called from the main extension.ts activate function
 */
export function registerTools(context: vscode.ExtensionContext) {
    // Register the GetTime tool
    // The name must match what's defined in package.json under languageModelTools
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_get_time', new GetTimeTool())
    );

    console.log('Tools registered successfully!');
}
