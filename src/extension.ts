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

    try {
        // Step 1: Get available language models (uses Copilot's models)
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4o'  // You can also use 'gpt-3.5-turbo' or other available models
        });

        if (models.length === 0) {
            stream.markdown('❌ No language model available. Make sure GitHub Copilot is installed and signed in.');
            return {};
        }

        const model = models[0];
        stream.progress('Thinking...');

        // Step 2: Create messages array for the LLM
        const messages = [
            vscode.LanguageModelChatMessage.User(userMessage)
        ];

        // Step 3: Send to LLM and stream the response
        const response = await model.sendRequest(messages, {}, token);

        // Step 4: Stream each chunk of the response as it arrives
        for await (const chunk of response.text) {
            stream.markdown(chunk);
        }

    } catch (error) {
        // Handle errors gracefully
        if (error instanceof vscode.LanguageModelError) {
            stream.markdown(`⚠️ Language Model Error: ${error.message}`);
        } else {
            stream.markdown(`❌ Error: ${error}`);
        }
    }

    return {};
}

export function deactivate() {
    console.log('Hello Chat Participant is now deactivated.');
}
