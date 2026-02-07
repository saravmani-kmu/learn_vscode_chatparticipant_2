import * as vscode from 'vscode';
import fetch from 'node-fetch'; // Ensure 'node-fetch' is installed in your target project: npm install node-fetch

// Checkmarx constants
const CX_CLIENT_ID = 'ide_client';
const CX_SCOPES = 'offline_access openid sast_api sast-permissions access_control_api';

export class CheckmarxAuthService implements vscode.UriHandler {
    private cxBaseUrl: string = '';
    private redirectUri: vscode.Uri;

    constructor(private context: vscode.ExtensionContext) {
        // Construct the redirect URI based on the publisher and extension name
        // vscode://publisher.extension-name
        this.redirectUri = vscode.Uri.parse(`${vscode.env.uriScheme}://${context.extension.packageJSON.publisher}.${context.extension.packageJSON.name}`);
    }

    /**
     * Initiates the SSO login flow.
     * @param baseUrl The base URL of the Checkmarx server (e.g., https://checkmarx.example.com)
     */
    public async login(baseUrl: string): Promise<void> {
        this.cxBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash if present

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: CX_CLIENT_ID,
            scope: CX_SCOPES,
            redirect_uri: this.redirectUri.toString()
        });

        const authUrl = `${this.cxBaseUrl}/CxRestAPI/auth/identity/connect/authorize?${params.toString()}`;

        // Open the system browser to the authorization URL
        await vscode.env.openExternal(vscode.Uri.parse(authUrl));
    }

    /**
     * Handles the redirect from the Checkmarx identity server.
     * This method is called by VS Code when the custom URI scheme is invoked.
     */
    public async handleUri(uri: vscode.Uri): Promise<void> {
        const query = new URLSearchParams(uri.query);
        const code = query.get('code');

        if (code) {
            await this.exchangeCodeForToken(code);
        } else {
            vscode.window.showErrorMessage('Checkmarx SSO Login failed: No authorization code received.');
        }
    }

    /**
     * Exchanges the authorization code for access and refresh tokens.
     */
    private async exchangeCodeForToken(code: string): Promise<void> {
        try {
            const tokenUrl = `${this.cxBaseUrl}/CxRestAPI/auth/identity/connect/token`;

            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: CX_CLIENT_ID,
                code: code,
                redirect_uri: this.redirectUri.toString()
            });

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP Error ${response.status}: ${errorText}`);
            }

            const data: any = await response.json();
            const accessToken = data.access_token;
            const refreshToken = data.refresh_token;

            // Securely store the tokens
            await this.storeToken('cx_access_token', accessToken);
            if (refreshToken) {
                await this.storeToken('cx_refresh_token', refreshToken);
            }

            // Store the base URL for future API calls
            await this.context.globalState.update('cx_base_url', this.cxBaseUrl);

            vscode.window.showInformationMessage(`Successfully logged in to Checkmarx at ${this.cxBaseUrl}`);

        } catch (error) {
            vscode.window.showErrorMessage(`Checkmarx Token exchange failed: ${error}`);
            console.error(error);
        }
    }

    private async storeToken(key: string, value: string): Promise<void> {
        await this.context.secrets.store(key, value);
    }

    public async getToken(key: string): Promise<string | undefined> {
        return await this.context.secrets.get(key);
    }

    public getBaseUrl(): string | undefined {
        return this.context.globalState.get<string>('cx_base_url');
    }
}
