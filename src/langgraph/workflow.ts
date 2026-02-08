/**
 * LangGraph Workflow - Multi-Agent Task Planner System
 * 
 * Flow:
 * 1. Task Planner analyzes user query
 * 2. Routes to TCI Agent, iTracker Agent, ScanIssues Agent, or combination
 * 3. Agents fetch data, parse HTML, store to CSV
 * 4. Summarizer combines all results
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState, TaskItem } from "./state";
import { tciAgentNode } from "./agents/tciAgent";
import { iTrackerAgentNode } from "./agents/iTrackerAgent";
import { scanIssuesAgentNode } from "./agents/scanIssuesAgent";
import { taskPlannerNode, summarizerNode } from "./agents/taskPlannerAgent";

// Define the state channels for LangGraph
const graphChannels = {
    userQuery: {
        value: (prev: string, next: string) => next ?? prev,
        default: () => "",
    },
    appId: {
        value: (prev: string, next: string) => next ?? prev,
        default: () => "",
    },
    agentsToInvoke: {
        value: (prev: ("tci" | "itracker" | "scanissues")[], next: ("tci" | "itracker" | "scanissues")[]) => next ?? prev,
        default: () => [] as ("tci" | "itracker" | "scanissues")[],
    },
    tciResponse: {
        value: (prev: string | undefined, next: string | undefined) => next ?? prev,
        default: () => undefined as string | undefined,
    },
    tciItems: {
        value: (prev: TaskItem[] | undefined, next: TaskItem[] | undefined) => next ?? prev,
        default: () => undefined as TaskItem[] | undefined,
    },
    iTrackerResponse: {
        value: (prev: string | undefined, next: string | undefined) => next ?? prev,
        default: () => undefined as string | undefined,
    },
    iTrackerItems: {
        value: (prev: TaskItem[] | undefined, next: TaskItem[] | undefined) => next ?? prev,
        default: () => undefined as TaskItem[] | undefined,
    },
    scanIssuesResponse: {
        value: (prev: string | undefined, next: string | undefined) => next ?? prev,
        default: () => undefined as string | undefined,
    },
    scanIssuesItems: {
        value: (prev: TaskItem[] | undefined, next: TaskItem[] | undefined) => next ?? prev,
        default: () => undefined as TaskItem[] | undefined,
    },
    finalSummary: {
        value: (prev: string | undefined, next: string | undefined) => next ?? prev,
        default: () => undefined as string | undefined,
    },
    allItems: {
        value: (prev: TaskItem[] | undefined, next: TaskItem[] | undefined) => next ?? prev,
        default: () => undefined as TaskItem[] | undefined,
    },
};

/**
 * Determine routing based on agents to invoke
 */
function getRoutingDecision(agents: ("tci" | "itracker" | "scanissues")[]): string {
    if (agents.length === 0) return "summarizer";

    // Start with first agent in the list
    if (agents.includes("tci")) return "tci";
    if (agents.includes("itracker")) return "itracker";
    if (agents.includes("scanissues")) return "scanissues";

    return "summarizer";
}

/**
 * Get next agent after current one
 */
function getNextAgent(currentAgent: string, agents: ("tci" | "itracker" | "scanissues")[]): string {
    const agentOrder = ["tci", "itracker", "scanissues"];
    const currentIndex = agentOrder.indexOf(currentAgent);

    for (let i = currentIndex + 1; i < agentOrder.length; i++) {
        if (agents.includes(agentOrder[i] as any)) {
            return agentOrder[i];
        }
    }

    return "summarizer";
}

/**
 * Build the LangGraph workflow
 */
export function buildWorkflow() {
    // Create the graph with state channels
    const workflow = new StateGraph<AgentState>({
        channels: graphChannels,
    })
        // Add nodes
        .addNode("taskPlanner", taskPlannerNode)
        .addNode("tci", tciAgentNode)
        .addNode("itracker", iTrackerAgentNode)
        .addNode("scanissues", scanIssuesAgentNode)
        .addNode("summarizer", summarizerNode)

        // Start with task planner
        .addEdge(START, "taskPlanner")

        // Conditional routing from task planner
        .addConditionalEdges(
            "taskPlanner",
            (state: AgentState) => getRoutingDecision(state.agentsToInvoke || []),
            {
                tci: "tci",
                itracker: "itracker",
                scanissues: "scanissues",
                summarizer: "summarizer",
            }
        )

        // After TCI, check for next agent
        .addConditionalEdges(
            "tci",
            (state: AgentState) => getNextAgent("tci", state.agentsToInvoke || []),
            {
                itracker: "itracker",
                scanissues: "scanissues",
                summarizer: "summarizer",
            }
        )

        // After iTracker, check for next agent
        .addConditionalEdges(
            "itracker",
            (state: AgentState) => getNextAgent("itracker", state.agentsToInvoke || []),
            {
                scanissues: "scanissues",
                summarizer: "summarizer",
            }
        )

        // After ScanIssues, go to summarizer
        .addEdge("scanissues", "summarizer")

        // End after summarizer
        .addEdge("summarizer", END);

    // Compile and return the graph
    return workflow.compile();
}

/**
 * Run the workflow with a user query
 */
export async function runWorkflow(userQuery: string, appId: string): Promise<AgentState> {
    const graph = buildWorkflow();

    const initialState: Partial<AgentState> = {
        userQuery,
        appId,
        agentsToInvoke: [],
    };

    console.log("\n" + "=".repeat(60));
    console.log("Starting LangGraph Multi-Agent Workflow");
    console.log("=".repeat(60) + "\n");

    const result = await graph.invoke(initialState);

    console.log("\n" + "=".repeat(60));
    console.log("Workflow Complete");
    console.log("=".repeat(60) + "\n");

    return result as unknown as AgentState;
}
