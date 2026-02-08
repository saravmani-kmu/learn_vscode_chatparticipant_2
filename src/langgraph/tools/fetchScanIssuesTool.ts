/**
 * FetchScanIssues Tool - Fetches security scan issues for an application
 * Returns hardcoded HTML with sample scan issues table data
 */

export function fetchScanIssues(appId: string): string {
    // Hardcoded HTML response simulating security scan data fetch
    const htmlContent = `
<!DOCTYPE html>
<html>
<head><title>Security Scan Issues for ${appId}</title></head>
<body>
    <h1>Security Scan Issues - ${appId}</h1>
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
                <td>Security Scan</td>
                <td>SQL Injection</td>
                <td>Fix SQL injection in login module</td>
                <td>2026-02-15</td>
                <td>SCAN-1001</td>
                <td>Critical</td>
                <td>User input not sanitized in auth/login.ts:45</td>
            </tr>
            <tr>
                <td>Security Scan</td>
                <td>XSS</td>
                <td>Remediate XSS vulnerability in comments</td>
                <td>2026-02-20</td>
                <td>SCAN-1002</td>
                <td>High</td>
                <td>Reflected XSS in comments/display.ts:112</td>
            </tr>
            <tr>
                <td>Security Scan</td>
                <td>Dependency</td>
                <td>Upgrade vulnerable lodash package</td>
                <td>2026-02-25</td>
                <td>SCAN-1003</td>
                <td>Medium</td>
                <td>CVE-2021-23337 affects lodash <4.17.21</td>
            </tr>
            <tr>
                <td>Security Scan</td>
                <td>Secrets</td>
                <td>Remove hardcoded API keys</td>
                <td>2026-02-18</td>
                <td>SCAN-1004</td>
                <td>Critical</td>
                <td>API keys found in config/secrets.ts</td>
            </tr>
            <tr>
                <td>Security Scan</td>
                <td>CSRF</td>
                <td>Implement CSRF tokens for forms</td>
                <td>2026-03-01</td>
                <td>SCAN-1005</td>
                <td>High</td>
                <td>Missing CSRF protection on POST endpoints</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
`;
    return htmlContent;
}
