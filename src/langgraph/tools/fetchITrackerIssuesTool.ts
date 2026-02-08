/**
 * FetchITrackerIssues Tool - Fetches iTracker issues for an application
 * Returns hardcoded HTML with sample iTracker table data
 */

export function fetchITrackerIssues(appId: string): string {
    // Hardcoded HTML response simulating iTracker data fetch
    const htmlContent = `
<!DOCTYPE html>
<html>
<head><title>iTracker Issues for ${appId}</title></head>
<body>
    <h1>iTracker Issues - ${appId}</h1>
    <table border="1">
        <thead>
            <tr>
                <th>Task Type</th>
                <th>Task SubType</th>
                <th>Task</th>
                <th>Due Date</th>
                <th>JIRA</th>
                <th>Status</th>
                <th>More Details</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Bug</td>
                <td>Critical</td>
                <td>Fix login timeout issue</td>
                <td>2026-02-20</td>
                <td>BUG-2001</td>
                <td>In Progress</td>
                <td>Users experiencing 30s timeout on login</td>
            </tr>
            <tr>
                <td>Feature</td>
                <td>Enhancement</td>
                <td>Add MFA support</td>
                <td>2026-03-10</td>
                <td>FEAT-3002</td>
                <td>Open</td>
                <td>Multi-factor authentication requirement</td>
            </tr>
            <tr>
                <td>Bug</td>
                <td>Medium</td>
                <td>Memory leak in report generation</td>
                <td>2026-02-25</td>
                <td>BUG-2003</td>
                <td>Open</td>
                <td>Memory increases over time when generating reports</td>
            </tr>
            <tr>
                <td>Task</td>
                <td>Documentation</td>
                <td>Update API documentation</td>
                <td>2026-03-05</td>
                <td>DOC-4001</td>
                <td>Done</td>
                <td>Swagger docs need updating for v2 APIs</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
`;
    return htmlContent;
}
