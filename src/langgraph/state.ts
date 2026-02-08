/**
 * Shared state interface for the LangGraph multi-agent workflow
 */
export interface TaskItem {
    App_id: string;
    Task_Type: string;
    Task_SubType: string;
    Task: string;
    DueDate: string;
    Parent_JIRA: string;
    JIRA: string;
    Status: string;
    MoreDetails: string;
}

export interface AgentState {
    // Input from user
    userQuery: string;
    appId: string;

    // Routing decision
    agentsToInvoke: ("tci" | "itracker" | "scanissues")[];

    // Agent responses
    tciResponse?: string;
    tciItems?: TaskItem[];
    iTrackerResponse?: string;
    iTrackerItems?: TaskItem[];
    scanIssuesResponse?: string;
    scanIssuesItems?: TaskItem[];

    // Final output
    finalSummary?: string;
    allItems?: TaskItem[];
}

/**
 * Initial state factory
 */
export function createInitialState(userQuery: string, appId: string): AgentState {
    return {
        userQuery,
        appId,
        agentsToInvoke: [],
    };
}
