
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response } from "express";
import cors from "cors";
import { GetTimeTool } from "./tools/getTimeTool";
import { GitHubCloneTool } from "./tools/githubCloneTool";
import { RunTerminalCommandTool } from "./tools/runTerminalCommandTool";
import { GitHubVulnerabilitiesTool } from "./tools/githubVulnerabilitiesTool";
import * as vscode from 'vscode';
import { z } from "zod";

export class McpServerManager {
    private app: express.Express;
    private server: any; // Express server instance
    private mcpServer: Server;
    private transport: SSEServerTransport | undefined;

    // Tools
    private getTimeTool: GetTimeTool;
    private githubCloneTool: GitHubCloneTool;
    private runTerminalCommandTool: RunTerminalCommandTool;
    private githubVulnerabilitiesTool: GitHubVulnerabilitiesTool;

    constructor() {
        this.app = express();
        this.app.use(cors());

        this.getTimeTool = new GetTimeTool();
        this.githubCloneTool = new GitHubCloneTool();
        this.runTerminalCommandTool = new RunTerminalCommandTool();
        this.githubVulnerabilitiesTool = new GitHubVulnerabilitiesTool();

        // Initialize MCP Server
        this.mcpServer = new Server(
            {
                name: "Hello VS Code Chat Participant",
                version: "0.0.1"
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        this.setupHandlers();
    }

    private setupHandlers() {
        // Handler: List available tools
        this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "get_time",
                        description: "Gets the current date and time.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                timezone: { type: "string", description: "Optional timezone" }
                            }
                        }
                    },
                    {
                        name: "github_clone",
                        description: "Clones a GitHub repository.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                repoName: { type: "string", description: "Repository name in 'owner/repo' format" },
                                branch: { type: "string", description: "Optional branch name" },
                                targetFolder: { type: "string", description: "Optional target folder" }
                            },
                            required: ["repoName"]
                        }
                    },
                    {
                        name: "run_terminal_command",
                        description: "Executes a command in the VS Code terminal.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                command: { type: "string", description: "The command to execute" },
                                name: { type: "string", description: "Optional terminal name" }
                            },
                            required: ["command"]
                        }
                    },
                    {
                        name: "github_vulnerabilities",
                        description: "Checks for code scanning alerts on the current repository.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                owner: { type: "string", description: "Repository owner" },
                                repo: { type: "string", description: "Repository name" },
                                branch: { type: "string", description: "Branch name" }
                            }
                        }
                    }
                ]
            };
        });

        // Handler: Execute a tool
        this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
            const toolName = request.params.name;
            const args: any = request.params.arguments || {};

            if (toolName === "get_time") {
                try {
                    const result = await this.getTimeTool.execute(args);
                    return {
                        content: [{ type: "text", text: result }]
                    };
                } catch (error: any) {
                    throw new McpError(ErrorCode.InternalError, `Error executing get_time: ${error.message}`);
                }
            }

            if (toolName === "github_clone") {
                try {
                    // Basic validation for required params
                    if (!args.repoName) {
                        throw new McpError(ErrorCode.InvalidParams, "repoName is required");
                    }
                    const result = await this.githubCloneTool.execute({
                        repoName: args.repoName,
                        branch: args.branch,
                        targetFolder: args.targetFolder
                    });
                    return {
                        content: [{ type: "text", text: result }]
                    };
                } catch (error: any) {
                    return {
                        content: [{ type: "text", text: `Error: ${error.message}` }],
                        isError: true
                    };
                }
            }

            if (toolName === "run_terminal_command") {
                try {
                    if (!args.command) {
                        throw new McpError(ErrorCode.InvalidParams, "command is required");
                    }
                    const result = await this.runTerminalCommandTool.execute({
                        command: args.command,
                        name: args.name
                    });
                    return {
                        content: [{ type: "text", text: result }]
                    };
                } catch (error: any) {
                    return {
                        content: [{ type: "text", text: `Error: ${error.message}` }],
                        isError: true
                    };
                }
            }

            if (toolName === "github_vulnerabilities") {
                try {
                    const result = await this.githubVulnerabilitiesTool.execute({
                        owner: args.owner,
                        repo: args.repo,
                        branch: args.branch
                    });
                    return {
                        content: [{ type: "text", text: result }]
                    };
                } catch (error: any) {
                    return {
                        content: [{ type: "text", text: `Error: ${error.message}` }],
                        isError: true
                    };
                }
            }

            throw new McpError(ErrorCode.MethodNotFound, `Tool ${toolName} not found`);
        });
    }

    public start(port: number = 3000) {
        // SSE Endpoint
        this.app.get("/sse", async (req: Request, res: Response) => {
            console.log("New SSE connection");
            this.transport = new SSEServerTransport("/message", res);
            await this.mcpServer.connect(this.transport);
        });

        // Message Handling Endpoint
        this.app.post("/message", async (req: Request, res: Response) => {
            // console.log("Message received");
            if (!this.transport) {
                res.status(500).send("No active transport");
                return;
            }
            await this.transport.handlePostMessage(req, res);
        });

        this.server = this.app.listen(port, () => {
            console.log(`MCP Server running on port ${port}`);
            vscode.window.showInformationMessage(`MCP Server started on port ${port}`);
        });
    }

    public stop() {
        if (this.server) {
            this.server.close();
            console.log("MCP Server stopped");
        }
    }
}
