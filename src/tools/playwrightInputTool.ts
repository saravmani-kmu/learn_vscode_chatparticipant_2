import * as vscode from 'vscode';
import { chromium, Browser, Page } from 'playwright';

/**
 * A Playwright-based tool that opens a browser, navigates to a URL,
 * and types text into the first input field.
 */

export interface IPlaywrightInputParameters {
    url: string;        // URL to navigate to
    textToType: string; // Text to type into the first input field
}

export class PlaywrightInputTool implements vscode.LanguageModelTool<IPlaywrightInputParameters> {

    /**
     * Called before the tool is invoked to show a confirmation message
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IPlaywrightInputParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {
        const { url, textToType } = options.input;
        return {
            invocationMessage: `Opening browser and typing "${textToType}" at ${url}...`,
            confirmationMessages: {
                title: 'Playwright Browser Input',
                message: new vscode.MarkdownString(
                    `Open browser and type **"${textToType}"** into the first input field at:\n\n${url}`
                ),
            },
        };
    }

    /**
     * Called when the tool is actually invoked
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IPlaywrightInputParameters>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const result = await this.execute(options.input);

        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(result)
        ]);
    }

    /**
     * Core logic for browser automation
     */
    async execute(input: IPlaywrightInputParameters): Promise<string> {
        const { url, textToType } = input;

        let browser: Browser | null = null;
        let page: Page | null = null;

        try {
            // Launch browser (visible, not headless)
            browser = await chromium.launch({
                headless: false,
                slowMo: 100,  // Slow down for visibility
                channel: 'chrome' // Use installed Chrome
            });

            // Create a new page
            page = await browser.newPage();

            // Navigate to the URL
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            // Find the first input element and type into it
            const inputLocator = page.locator('input').nth(1);
            await inputLocator.waitFor({ state: 'visible', timeout: 10000 });
            await inputLocator.click();
            await inputLocator.fill(textToType);

            // Wait a bit so user can see the result
            await page.waitForTimeout(3000);

            // Close the browser
            await browser.close();
            browser = null;

            return `Successfully typed "${textToType}" into the first input field at ${url}`;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Ensure browser is closed on error
            if (browser) {
                await browser.close();
            }

            return `Failed to complete browser action: ${errorMessage}`;
        }
    }
}
