import * as vscode from 'vscode';
import { GetTimeTool } from './getTimeTool';
import { GitHubCloneTool } from './githubCloneTool';
import { OpenBrowserTool } from './openBrowserTool';

/**
 * Register all tools for this extension
 * This is called from the main extension.ts activate function
 */
export function registerTools(context: vscode.ExtensionContext) {
    // Register the GetTime tool
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_get_time', new GetTimeTool())
    );

    // Register the GitHub Clone tool
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_github_clone', new GitHubCloneTool())
    );

    // Register the Open Browser tool
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_open_browser', new OpenBrowserTool())
    );

    console.log('Tools registered: get_time, github_clone, open_browser');
}
