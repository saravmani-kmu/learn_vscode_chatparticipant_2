import * as vscode from 'vscode';
import * as chatUtils from '@vscode/chat-extension-utils';

// This is the main extension file that registers our chat participant

export function activate(context: vscode.ExtensionContext) {
    console.log('Hello Chat Participant is now active!');

    // Create the chat request handler using chat-extension-utils
    const handler: vscode.ChatRequestHandler = async (
        request: vscode.ChatRequest,
        chatContext: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ) => {
        // Use sendChatParticipantRequest - it handles:
        // - Picking a chat model
        // - Crafting the prompt with chat history
        // - Streaming the response back
        // - Tool calling loop (if tools are provided)
        const libResult = chatUtils.sendChatParticipantRequest(
            request,
            chatContext,
            {
                // Your custom system prompt - this is what makes your participant unique!
                prompt: 'You are a friendly and helpful coding assistant. Be concise and helpful.',

                // Automatically stream the response back to VS Code
                responseStreamOptions: {
                    stream,
                    references: true,   // Include reference links
                    responseText: true  // Stream the text response
                },

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
}
