/**
 * Entry point for running the LangGraph Multi-Agent Task Planner
 * 
 * Usage: npx tsx src/langgraph/index.ts
 */

import { runWorkflow } from "./workflow";

// Example queries demonstrating different routing scenarios
const testQueries = [
    {
        query: "Get all TCI compliance items for the application",
        appId: "APP-001",
        description: "Should invoke only TCI Agent",
    },
    {
        query: "Show me iTracker issues and bugs",
        appId: "APP-002",
        description: "Should invoke only iTracker Agent",
    },
    {
        query: "Fetch all tasks including TCI and issues",
        appId: "APP-003",
        description: "Should invoke both agents",
    },
];

async function main() {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║     LangGraph Multi-Agent Task Planner Demo            ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    // Run the third test case (both agents)
    const test = testQueries[2];

    console.log(`📋 Test: ${test.description}`);
    console.log(`   Query: "${test.query}"`);
    console.log(`   App ID: ${test.appId}\n`);

    try {
        const result = await runWorkflow(test.query, test.appId);

        console.log("\n📊 Final Summary:");
        console.log("-".repeat(60));
        console.log(result.finalSummary);
        console.log("-".repeat(60));

        if (result.allItems) {
            console.log(`\n✅ Total items stored: ${result.allItems.length}`);
        }
    } catch (error) {
        console.error("❌ Error running workflow:", error);
    }
}

// Run if this is the main module
main().catch(console.error);
