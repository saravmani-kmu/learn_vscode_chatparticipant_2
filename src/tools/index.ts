import * as vscode from 'vscode';
import { GetTimeTool } from './getTimeTool';
import { GitHubCloneTool } from './githubCloneTool';
import { RunTerminalCommandTool } from './runTerminalCommandTool';
import { GitHubVulnerabilitiesTool } from './githubVulnerabilitiesTool';
import { RunVscodeCommandTool } from './runVscodeCommandTool';
import { ListVscodeCommandsTool } from './listVscodeCommandsTool';

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

    // Register the Run VS Code Command tool
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_run_vscode_command', new RunVscodeCommandTool())
    );

    // Register the List VS Code Commands tool
    context.subscriptions.push(
        vscode.lm.registerTool('hello-chat-participant_list_vscode_commands', new ListVscodeCommandsTool())
    );

    console.log('Tools registered: get_time, github_clone, run_terminal_command, github_vulnerabilities, run_vscode_command, list_vscode_commands');
}

