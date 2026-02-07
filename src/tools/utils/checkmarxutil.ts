import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch'; // Ensure 'node-fetch' is installed
import FormData from 'form-data'; // Ensure 'form-data' is installed: npm install form-data
import JSZip from 'jszip'; // Ensure 'jszip' is installed: npm install jszip

export class CheckmarxScanUtil {

    constructor(private context: vscode.ExtensionContext) { }

    private async getAccessToken(): Promise<string | undefined> {
        return await this.context.secrets.get('cx_access_token');
    }

    private getBaseUrl(): string | undefined {
        return this.context.globalState.get<string>('cx_base_url');
    }

    /**
     * Triggers a scan for a specific folder.
     * @param folderPath The absolute path of the folder to scan.
     * @param projectName The name of the project in Checkmarx.
     * @param teamId The ID of the team in Checkmarx.
     * @param presetId The ID of the scan preset (e.g., 36 for 'Checkmarx Default').
     */
    public async triggerScan(folderPath: string, projectName: string, teamId: string, presetId: number = 36): Promise<void> {
        const baseUrl = this.getBaseUrl();
        const token = await this.getAccessToken();

        if (!baseUrl || !token) {
            vscode.window.showErrorMessage('Checkmarx: Not logged in. Please login first.');
            return;
        }

        try {
            // 1. Zip the folder
            const zipBuffer = await this.zipFolder(folderPath);

            // 2. Ensure Project Exists (or get ID)
            const projectId = await this.getOrCreateProject(baseUrl, token, projectName, teamId);

            // 3. Upload Zip
            const uploadedSource = await this.uploadSourceCode(baseUrl, token, projectId, zipBuffer);

            // 4. Create Scan
            const scanId = await this.createScan(baseUrl, token, projectId, presetId);

            vscode.window.showInformationMessage(`Checkmarx Scan started successfully! Scan ID: ${scanId}`);

        } catch (error) {
            vscode.window.showErrorMessage(`Checkmarx Scan failed: ${error}`);
            console.error(error);
        }
    }

    private async zipFolder(folderPath: string): Promise<Buffer> {
        const zip = new JSZip();

        const addFiles = async (dir: string, root: string) => {
            const files = await fs.promises.readdir(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = await fs.promises.stat(filePath);

                if (stat.isDirectory()) {
                    await addFiles(filePath, root);
                } else {
                    const relativePath = path.relative(root, filePath);
                    const content = await fs.promises.readFile(filePath);
                    zip.file(relativePath, content);
                }
            }
        };

        await addFiles(folderPath, folderPath);
        return await zip.generateAsync({ type: 'nodebuffer' });
    }

    private async getOrCreateProject(baseUrl: string, token: string, projectName: string, teamId: string): Promise<number> {
        // Check if project exists
        const getUrl = `${baseUrl}/CxRestAPI/projects?projectname=${encodeURIComponent(projectName)}&teamId=${teamId}`;
        const getRes = await fetch(getUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (getRes.ok) {
            const projects: any = await getRes.json();
            if (projects.length > 0) {
                return projects[0].id;
            }
        }

        // Create project
        const createUrl = `${baseUrl}/CxRestAPI/projects`;
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: projectName,
                teamId: teamId,
                isPublic: true
            })
        });

        if (!createRes.ok) {
            const errorText = await createRes.text();
            throw new Error(`Failed to create project: ${createRes.status} ${errorText}`);
        }

        const projectData: any = await createRes.json();
        return projectData.id;
    }

    private async uploadSourceCode(baseUrl: string, token: string, projectId: number, zipBuffer: Buffer): Promise<void> {
        // This is a simplified example. Checkmarx typically requires uploading to a specific endpoint
        // capable of handling multipart/form-data or binary streams.
        // For CxSAST, the modern API usually involves uploading source code to the 'projects/{id}/sourceCode/attachments' endpoint.

        const uploadUrl = `${baseUrl}/CxRestAPI/projects/${projectId}/sourceCode/attachments`;

        const form = new FormData();
        form.append('zippedSource', zipBuffer, { filename: 'source_code.zip', contentType: 'application/zip' });

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });

        if (!response.ok) {
            const errorText = await response.text();
            // 204 No Content is success for some endpoints, but usually 202/200 for uploads
            if (response.status !== 204) {
                throw new Error(`Failed to upload source: ${response.status} ${errorText}`);
            }
        }
    }

    private async createScan(baseUrl: string, token: string, projectId: number, presetId: number): Promise<number> {
        const scanUrl = `${baseUrl}/CxRestAPI/sast/scans`;
        const response = await fetch(scanUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectId: projectId,
                presetId: presetId,
                isIncremental: false,
                isPublic: true,
                forceScan: true,
                comment: "Scan triggered from VS Code Extension"
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create scan: ${response.status} ${errorText}`);
        }

        const scanData: any = await response.json();
        return scanData.id;
    }
}
