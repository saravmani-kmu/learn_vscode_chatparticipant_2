import * as vscode from 'vscode';

// This is the main extension file that registers our chat participant

export function activate(context: vscode.ExtensionContext) {
    console.log('Hello Chat Participant is now active!');

    // Register the chat participant with the ID matching package.json
    const participant = vscode.chat.createChatParticipant(
        'hello-chat-participant.hello',  // Must match the "id" in package.json
        handleChatRequest                 // The handler function
    );

    // Optional: Set an icon for the participant
    participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

    // Add the participant to subscriptions for proper cleanup
    context.subscriptions.push(participant);
}

// This function handles incoming chat requests
async function handleChatRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
): Promise<vscode.ChatResult> {

    // Get what the user typed
    const userMessage = request.prompt;

    // Stream a response back to the user
    stream.markdown(`## Hello! 👋\n\n`);
    stream.markdown(`You said: **"${userMessage}"**\n\n`);
    stream.markdown(`This is a simple chat participant demo. I just echo back what you type!\n\n`);
    stream.markdown(`---\n`);
    stream.markdown(`*Tip: Use \`@hello\` in GitHub Copilot Chat to talk to me.*`);

    // Return an empty result (no metadata needed for this simple example)
    return {};
}

export function deactivate() {
    console.log('Hello Chat Participant is now deactivated.');
}
