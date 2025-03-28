import * as vscode from 'vscode';

export class QueryEditorProvider {
    public static readonly viewType = 'sfdcQueryEditor';

    private _panel: vscode.WebviewPanel | undefined;
    private _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _onRunQuery: (query: string) => Promise<void>
    ) {}

    public show() {
        if (this._panel) {
            this._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            QueryEditorProvider.viewType,
            'SOQL Query Editor',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'runQuery':
                        await this._onRunQuery(message.query);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SOQL Query Editor</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        margin: 0;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .editor-container {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        margin-bottom: 20px;
                    }
                    .query-editor {
                        flex: 1;
                        width: 100%;
                        padding: 10px;
                        border: 1px solid var(--vscode-input-border);
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        font-family: 'Consolas', 'Courier New', monospace;
                        font-size: 14px;
                        line-height: 1.5;
                        resize: none;
                        box-sizing: border-box;
                    }
                    .button-group {
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    button {
                        padding: 8px 16px;
                        border: none;
                        cursor: pointer;
                        font-weight: bold;
                    }
                    .run-btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    .run-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    .results-container {
                        flex: 1;
                        overflow: auto;
                        border: 1px solid var(--vscode-input-border);
                        padding: 10px;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin-top: 10px;
                    }
                    th, td {
                        border: 1px solid var(--vscode-input-border);
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        position: sticky;
                        top: 0;
                    }
                    tr:nth-child(even) {
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }
                    .total-records {
                        color: var(--vscode-descriptionForeground);
                    }
                    .error {
                        color: var(--vscode-errorForeground);
                        padding: 10px;
                        margin: 10px 0;
                        border: 1px solid var(--vscode-errorForeground);
                        display: none;
                    }
                    .loading {
                        display: none;
                        text-align: center;
                        padding: 20px;
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="editor-container">
                    <textarea id="queryEditor" class="query-editor" placeholder="Enter your SOQL query here..."></textarea>
                    <div class="button-group">
                        <button id="runButton" class="run-btn" onclick="runQuery()">Run Query</button>
                    </div>
                </div>
                <div id="loading" class="loading">Running query...</div>
                <div id="error" class="error"></div>
                <div id="results" class="results-container"></div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const queryEditor = document.getElementById('queryEditor');
                    const runButton = document.getElementById('runButton');
                    const loading = document.getElementById('loading');
                    const error = document.getElementById('error');
                    const results = document.getElementById('results');
                    
                    function runQuery() {
                        const query = queryEditor.value.trim();
                        if (!query) {
                            showError('Please enter a query');
                            return;
                        }

                        loading.style.display = 'block';
                        error.style.display = 'none';
                        results.innerHTML = '';
                        runButton.disabled = true;

                        vscode.postMessage({
                            command: 'runQuery',
                            query: query
                        });
                    }

                    function showError(message) {
                        error.textContent = message;
                        error.style.display = 'block';
                        loading.style.display = 'none';
                        runButton.disabled = false;
                    }

                    function showResults(records, fields) {
                        loading.style.display = 'none';
                        runButton.disabled = false;

                        const html = \`
                            <div class="header">
                                <h2>Query Results</h2>
                                <div class="total-records">Total Records: \${records.length}</div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        \${fields.map(field => \`<th>\${field}</th>\`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    \${records.map(record => \`
                                        <tr>
                                            \${fields.map(field => \`<td>\${record[field] || ''}</td>\`).join('')}
                                        </tr>
                                    \`).join('')}
                                </tbody>
                            </table>
                        \`;

                        results.innerHTML = html;
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'error':
                                showError(message.error);
                                break;
                            case 'results':
                                showResults(message.records, message.fields);
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }

    public dispose() {
        this._panel?.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    public showError(errorMessage: string) {
        this._panel?.webview.postMessage({
            type: 'error',
            error: errorMessage
        });
    }

    public showResults(records: any[], fields: string[]) {
        this._panel?.webview.postMessage({
            type: 'results',
            records: records,
            fields: fields
        });
    }
} 