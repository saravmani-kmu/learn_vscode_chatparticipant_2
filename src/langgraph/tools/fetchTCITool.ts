/**
 * FetchTCI Tool - Fetches TCI (Technical Compliance Items) for an application
 * Returns hardcoded HTML with sample TCI table data
 */

export function fetchTCI(appId: string): string {
    // Hardcoded HTML response simulating TCI data fetch
    const htmlContent = `
<!DOCTYPE html>
<html>
<head><title>TCI Report for ${appId}</title></head>
<body>
    <h1>Technical Compliance Items - ${appId}</h1>
    <table border="1">
        <thead>
            <tr>
                <th>Task Type</th>
                <th>Task SubType</th>
                <th>Task</th>
                <th>Due Date</th>
                <th>Parent JIRA</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Security</td>
                <td>Vulnerability</td>
                <td>Update OpenSSL to v3.0</td>
                <td>2026-03-15</td>
                <td>SEC-1234</td>
            </tr>
            <tr>
                <td>Compliance</td>
                <td>Audit</td>
                <td>Complete SOX audit requirements</td>
                <td>2026-02-28</td>
                <td>AUDIT-567</td>
            </tr>
            <tr>
                <td>Security</td>
                <td>Certificate</td>
                <td>Renew SSL certificate</td>
                <td>2026-04-01</td>
                <td>CERT-890</td>
            </tr>
            <tr>
                <td>Performance</td>
                <td>Optimization</td>
                <td>Optimize database queries</td>
                <td>2026-03-20</td>
                <td>PERF-111</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
`;
    return htmlContent;
}
