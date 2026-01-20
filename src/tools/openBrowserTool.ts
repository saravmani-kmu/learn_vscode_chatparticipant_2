import * as vscode from 'vscode';
import { chromium } from 'playwright';

/**
 * A simple "Open Browser" tool using Playwright
 * Opens Chrome browser and navigates to the specified URL
 */

export interface IOpenBrowserParameters {
    url: string;  // URL to open in the browser
}

export class OpenBrowserTool implements vscode.LanguageModelTool<IOpenBrowserParameters> {

    /**
     * Called before the tool is invoked to show a confirmation message
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IOpenBrowserParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const url = options.input.url || 'No URL provided';
        return {
            invocationMessage: `Opening browser to ${url}...`,
            confirmationMessages: {
                title: 'Open Browser',
                message: new vscode.MarkdownString(`Open Chrome browser and navigate to **${url}**?`),
            },
        };
    }

    /**
     * Called when the tool is actually invoked
     * Opens Chrome browser using Playwright and navigates to the URL
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IOpenBrowserParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const url = options.input.url;

        if (!url) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart('Error: No URL provided. Please specify a URL to open.')
            ]);
        }

        try {
            // Launch Chrome browser
            const browser = await chromium.launch({
                headless: false,  // Show the browser window
                channel: 'chrome' // Use installed Chrome
            });

            // Create a new page and navigate to URL
            const page = await browser.newPage();
            await page.goto(url);

            const result = `Successfully opened Chrome browser and navigated to: ${url}`;

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(result)
            ]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error opening browser: ${errorMessage}`)
            ]);
        }
    }
}
