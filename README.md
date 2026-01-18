# Hello Chat Participant 👋

A simple "Hello World" VS Code Chat Participant for GitHub Copilot.

## What is a Chat Participant?

A Chat Participant is an extension that integrates with **GitHub Copilot Chat** in VS Code. Users can invoke your participant by typing `@yourname` in the chat.

## Project Structure

```
├── package.json          # Extension manifest (defines the chat participant)
├── tsconfig.json         # TypeScript configuration
├── src/
│   └── extension.ts      # Main extension code (chat handler)
└── .vscode/
    ├── launch.json       # Debug configuration
    └── tasks.json        # Build tasks
```

## Key Concepts

### 1. Registration in `package.json`
```json
"contributes": {
  "chatParticipants": [{
    "id": "hello-chat-participant.hello",
    "name": "hello",           // Users type @hello
    "description": "...",
    "isSticky": true           // Keeps participant active in chat
  }]
}
```

### 2. Handler Function in `extension.ts`
```typescript
async function handleChatRequest(
  request: vscode.ChatRequest,    // What the user typed
  context: vscode.ChatContext,    // Chat history
  stream: vscode.ChatResponseStream, // Send responses
  token: vscode.CancellationToken    // Handle cancellation
)
```

### 3. Streaming Responses
```typescript
stream.markdown("# Hello!");  // Send markdown formatted text
stream.progress("Working..."); // Show progress indicator
```

## How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Compile TypeScript:**
   ```bash
   npm run compile
   ```

3. **Debug the extension:**
   - Press `F5` in VS Code
   - A new VS Code window opens with your extension loaded

4. **Test it:**
   - Open GitHub Copilot Chat (Ctrl+Alt+I)
   - Type `@hello How are you?`
   - See the response!

## Requirements

- VS Code 1.93.0 or higher
- GitHub Copilot extension installed
- GitHub Copilot Chat extension installed

## Next Steps

Try modifying `src/extension.ts` to:
- Add commands using `request.command`
- Use context history with `context.history`
- Make API calls and stream the results
- Add multiple participants
