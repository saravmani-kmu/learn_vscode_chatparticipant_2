import * as vscode from 'vscode';
import * as chatUtils from '@vscode/chat-extension-utils';
import { registerTools } from './tools';
import { McpServerManager } from './mcpServer';

// This is the main extension file that registers our chat participant

let mcpServer: McpServerManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Hello Chat Participant is now active!');

    // Start MCP Server
    try {
        mcpServer = new McpServerManager();
        mcpServer.start(3000); // Start on port 3000
    } catch (err) {
        console.error('Failed to start MCP Server:', err);
    }

    // Register our custom tools
    registerTools(context);

    // Create the chat request handler using chat-extension-utils
    const handler: vscode.ChatRequestHandler = async (
        request: vscode.ChatRequest,
        chatContext: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ) => {
        // Get tools - filter to only our tools using the tag we defined in package.json
        // You can use 'all' to get all available tools, or filter by tag
        const tools = vscode.lm.tools.filter(tool =>
            tool.tags.includes('hello-tools')
        );

        console.log('Available tools:', tools.map(t => t.name));

        // Use sendChatParticipantRequest - it handles:
        // - Picking a chat model
        // - Crafting the prompt with chat history
        // - Streaming the response back
        // - Tool calling loop (automatically calls tools when LLM requests them)
        const libResult = chatUtils.sendChatParticipantRequest(
            request,
            chatContext,
            {
                // Your custom system prompt - this is what makes your participant unique!
                prompt: `You are a friendly and helpful coding assistant. 
You have access to tools that can help you answer questions.
When the user asks about the time or date, use the get_time tool to get the current time.
Be concise and helpful in your responses.`,

                // Automatically stream the response back to VS Code
                responseStreamOptions: {
                    stream,
                    references: true,   // Include reference links
                    responseText: true  // Stream the text response
                },

                // Pass the tools to the LLM
                tools,

                // Enable debug tracing in development mode
                extensionMode: context.extensionMode
            },
            token
        );

        // Return the result from the library (includes metadata and error handling)
        return await libResult.result;
    };

    // Register the chat participant
    const participant = vscode.chat.createChatParticipant(
        'hello-chat-participant.hello',
        handler
    );

    // Optional: Set an icon for the participant
    participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

    context.subscriptions.push(participant);
}

export function deactivate() {
    console.log('Hello Chat Participant is now deactivated.');
    if (mcpServer) {
        mcpServer.stop();
    }
}
