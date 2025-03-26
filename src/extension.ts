import * as vscode from 'vscode';
import * as jsforce from 'jsforce';

let conn: jsforce.Connection | null = null;

interface SalesforceRecord {
    [key: string]: any;
    attributes: {
        type: string;
        url: string;
    };
}

interface QueryResult {
    records: SalesforceRecord[];
    totalSize: number;
    done: boolean;
}

export function activate(context: vscode.ExtensionContext) {
    // Register login command
    let loginCommand = vscode.commands.registerCommand('sfdc-extension.login', async () => {
        const username = await vscode.window.showInputBox({
            prompt: 'Enter your Salesforce username',
            placeHolder: 'username@example.com'
        });

        if (!username) {
            return;
        }

        const password = await vscode.window.showInputBox({
            prompt: 'Enter your Salesforce password',
            password: true
        });

        if (!password) {
            return;
        }

        try {
            conn = new jsforce.Connection({
                loginUrl: 'https://login.salesforce.com'
            });

            await conn.login(username, password);
            vscode.window.showInformationMessage('Successfully logged in to Salesforce!');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to login: ${errorMessage}`);
        }
    });

    // Register run query command
    let runQueryCommand = vscode.commands.registerCommand('sfdc-extension.runQuery', async () => {
        if (!conn) {
            vscode.window.showErrorMessage('Please login to Salesforce first!');
            return;
        }

        const query = await vscode.window.showInputBox({
            prompt: 'Enter your SOQL query',
            placeHolder: 'SELECT Id, Name FROM Account LIMIT 10'
        });

        if (!query) {
            return;
        }

        try {
            const result = await conn.query<SalesforceRecord>(query);
            showQueryResults(result);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Query failed: ${errorMessage}`);
        }
    });

    context.subscriptions.push(loginCommand, runQueryCommand);
}

function showQueryResults(result: QueryResult) {
    const panel = vscode.window.createWebviewPanel(
        'queryResults',
        'Query Results',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    const records = result.records;
    const fields = records.length > 0 ? Object.keys(records[0]).filter(key => key !== 'attributes') : [];

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { padding: 10px; font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .header { margin-bottom: 20px; }
                .total-records { color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Query Results</h2>
                <div class="total-records">Total Records: ${records.length}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        ${fields.map(field => `<th>${field}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${records.map((record: SalesforceRecord) => `
                        <tr>
                            ${fields.map(field => `<td>${record[field] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;

    panel.webview.html = html;
    panel.reveal(vscode.ViewColumn.One);
}

export function deactivate() {
    if (conn) {
        conn.logout();
    }
} 