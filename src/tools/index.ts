import * as vscode from 'vscode';
import { GetTimeTool } from './getTimeTool';
import { GitHubCloneTool } from './githubCloneTool';
import { RunTerminalCommandTool } from './runTerminalCommandTool';
import { GitHubVulnerabilitiesTool } from './githubVulnerabilitiesTool';
import { WriteToFileTool } from './writeToFileTool';

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

    // Register the Run Terminal Command tool
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_run_terminal_command', new RunTerminalCommandTool())
    );

    // Register the GitHub Vulnerabilities tool
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_github_vulnerabilities', new GitHubVulnerabilitiesTool())
    );

    // Register the Write To File tool
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_write_to_file', new WriteToFileTool())
    );

    console.log('Tools registered: get_time, github_clone, run_terminal_command, github_vulnerabilities, write_to_file');
}
