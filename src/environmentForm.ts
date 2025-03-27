import * as vscode from 'vscode';

export class EnvironmentFormProvider {
    public static readonly viewType = 'sfdcEnvironmentForm';

    private _panel: vscode.WebviewPanel | undefined;
    private _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _onSubmit: (data: EnvironmentFormData) => Promise<void>
    ) {}

    public show() {
        if (this._panel) {
            this._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            EnvironmentFormProvider.viewType,
            'Add Salesforce Environment',
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
                    case 'submit':
                        await this._onSubmit(message.data);
                        this._panel?.dispose();
                        break;
                    case 'cancel':
                        this._panel?.dispose();
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
                <title>Add Salesforce Environment</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                    }
                    .form-group {
                        margin-bottom: 15px;
                    }
                    label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                    }
                    input {
                        width: 100%;
                        padding: 8px;
                        border: 1px solid var(--vscode-input-border);
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        box-sizing: border-box;
                    }
                    .button-group {
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                        margin-top: 20px;
                    }
                    button {
                        padding: 8px 16px;
                        border: none;
                        cursor: pointer;
                        font-weight: bold;
                    }
                    .submit-btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    .cancel-btn {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .error {
                        color: var(--vscode-errorForeground);
                        margin-top: 5px;
                        display: none;
                    }
                </style>
            </head>
            <body>
                <form id="environmentForm">
                    <div class="form-group">
                        <label for="name">Environment Name</label>
                        <input type="text" id="name" required placeholder="e.g., Production, Sandbox, Dev">
                        <div class="error" id="nameError"></div>
                    </div>
                    <div class="form-group">
                        <label for="url">Login URL</label>
                        <input type="url" id="url" required placeholder="https://login.salesforce.com">
                        <div class="error" id="urlError"></div>
                    </div>
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" required placeholder="username@example.com">
                        <div class="error" id="usernameError"></div>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" required>
                        <div class="error" id="passwordError"></div>
                    </div>
                    <div class="button-group">
                        <button type="button" class="cancel-btn" onclick="cancel()">Cancel</button>
                        <button type="submit" class="submit-btn">Add Environment</button>
                    </div>
                </form>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    document.getElementById('environmentForm').addEventListener('submit', (e) => {
                        e.preventDefault();
                        
                        const formData = {
                            name: document.getElementById('name').value,
                            url: document.getElementById('url').value,
                            username: document.getElementById('username').value,
                            password: document.getElementById('password').value
                        };

                        vscode.postMessage({
                            command: 'submit',
                            data: formData
                        });
                    });

                    function cancel() {
                        vscode.postMessage({
                            command: 'cancel'
                        });
                    }
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
}

export interface EnvironmentFormData {
    name: string;
    url: string;
    username: string;
    password: string;
} 