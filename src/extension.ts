import * as vscode from 'vscode';
import * as jsforce from 'jsforce';
import { EnvironmentFormProvider, EnvironmentFormData } from './environmentForm';

interface SalesforceEnvironment {
    name: string;
    username: string;
    password: string;
    securityToken?: string;
    instanceUrl: string;
    isActive: boolean;
    lastConnected?: Date;
}

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

class SalesforceEnvironmentProvider implements vscode.TreeDataProvider<SalesforceEnvironment> {
    private _onDidChangeTreeData: vscode.EventEmitter<SalesforceEnvironment | undefined | null | void> = new vscode.EventEmitter<SalesforceEnvironment | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SalesforceEnvironment | undefined | null | void> = this._onDidChangeTreeData.event;

    private environments: SalesforceEnvironment[] = [];
    private formProvider: EnvironmentFormProvider;

    constructor(private context: vscode.ExtensionContext) {
        this.loadEnvironments();
        this.formProvider = new EnvironmentFormProvider(context.extensionUri, this.handleFormSubmit.bind(this));
    }

    private loadEnvironments() {
        this.environments = this.context.globalState.get('sfdcEnvironments', []);
    }

    private saveEnvironments() {
        this.context.globalState.update('sfdcEnvironments', this.environments);
    }

    getTreeItem(element: SalesforceEnvironment): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.name);
        treeItem.description = element.isActive ? 'Active' : undefined;
        treeItem.contextValue = 'sfdcEnvironment';
        
        if (element.lastConnected) {
            const lastConnected = new Date(element.lastConnected);
            const now = new Date();
            const diffHours = (now.getTime() - lastConnected.getTime()) / (1000 * 60 * 60);
            
            if (diffHours > 24) {
                treeItem.iconPath = new vscode.ThemeIcon('warning');
                treeItem.tooltip = `Last connected: ${lastConnected.toLocaleString()}`;
            }
        }
        
        return treeItem;
    }

    getChildren(): SalesforceEnvironment[] {
        return this.environments;
    }

    async handleFormSubmit(data: EnvironmentFormData) {
        try {
            const conn = new jsforce.Connection({
                loginUrl: data.url
            });

            // Combine password and security token if provided
            const passwordWithToken = data.securityToken 
                ? data.password + data.securityToken 
                : data.password;

            await conn.login(data.username, passwordWithToken);
            
            const environment: SalesforceEnvironment = {
                name: data.name,
                username: data.username,
                password: data.password,
                securityToken: data.securityToken,
                instanceUrl: conn.instanceUrl,
                isActive: this.environments.length === 0,
                lastConnected: new Date()
            };

            this.addEnvironment(environment);
            vscode.window.showInformationMessage(`Successfully added environment: ${data.name}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to add environment: ${errorMessage}`);
        }
    }

    addEnvironment(environment: SalesforceEnvironment) {
        this.environments.push(environment);
        this.saveEnvironments();
        this._onDidChangeTreeData.fire();
    }

    removeEnvironment(environment: SalesforceEnvironment) {
        this.environments = this.environments.filter(e => e.name !== environment.name);
        this.saveEnvironments();
        this._onDidChangeTreeData.fire();
    }

    setActiveEnvironment(environment: SalesforceEnvironment) {
        this.environments.forEach(e => e.isActive = e.name === environment.name);
        this.saveEnvironments();
        this._onDidChangeTreeData.fire();
    }

    getActiveEnvironment(): SalesforceEnvironment | undefined {
        return this.environments.find(e => e.isActive);
    }

    async refreshConnection(environment: SalesforceEnvironment): Promise<boolean> {
        try {
            const conn = new jsforce.Connection({
                loginUrl: environment.instanceUrl
            });

            // Combine password and security token if provided
            const passwordWithToken = environment.securityToken 
                ? environment.password + environment.securityToken 
                : environment.password;

            await conn.login(environment.username, passwordWithToken);
            environment.lastConnected = new Date();
            this.saveEnvironments();
            this._onDidChangeTreeData.fire();
            return true;
        } catch (error) {
            return false;
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    showAddEnvironmentForm() {
        this.formProvider.show();
    }
}

let environmentProvider: SalesforceEnvironmentProvider;
let activeConnection: jsforce.Connection | null = null;

export function activate(context: vscode.ExtensionContext) {
    environmentProvider = new SalesforceEnvironmentProvider(context);

    // Register view provider
    const environmentsView = vscode.window.createTreeView('sfdcEnvironments', {
        treeDataProvider: environmentProvider
    });

    // Register add environment command
    let addEnvironmentCommand = vscode.commands.registerCommand('sfdc-extension.addEnvironment', () => {
        environmentProvider.showAddEnvironmentForm();
    });

    // Register remove environment command
    let removeEnvironmentCommand = vscode.commands.registerCommand('sfdc-extension.removeEnvironment', async (environment: SalesforceEnvironment) => {
        const result = await vscode.window.showWarningMessage(
            `Are you sure you want to remove the environment "${environment.name}"?`,
            { modal: true },
            'Yes'
        );

        if (result === 'Yes') {
            environmentProvider.removeEnvironment(environment);
            vscode.window.showInformationMessage(`Environment "${environment.name}" removed`);
        }
    });

    // Register set active environment command
    let setActiveEnvironmentCommand = vscode.commands.registerCommand('sfdc-extension.setActiveEnvironment', async (environment: SalesforceEnvironment) => {
        const isConnected = await environmentProvider.refreshConnection(environment);
        if (isConnected) {
            environmentProvider.setActiveEnvironment(environment);
            vscode.window.showInformationMessage(`Active environment set to: ${environment.name}`);
        } else {
            vscode.window.showErrorMessage(`Failed to connect to environment: ${environment.name}`);
        }
    });

    // Register run query command
    let runQueryCommand = vscode.commands.registerCommand('sfdc-extension.runQuery', async () => {
        const activeEnvironment = environmentProvider.getActiveEnvironment();
        if (!activeEnvironment) {
            vscode.window.showErrorMessage('Please select an active environment first!');
            return;
        }

        const isConnected = await environmentProvider.refreshConnection(activeEnvironment);
        if (!isConnected) {
            vscode.window.showErrorMessage(`Failed to connect to environment: ${activeEnvironment.name}`);
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
            const conn = new jsforce.Connection({
                loginUrl: activeEnvironment.instanceUrl
            });

            // Combine password and security token if provided
            const passwordWithToken = activeEnvironment.securityToken 
                ? activeEnvironment.password + activeEnvironment.securityToken 
                : activeEnvironment.password;

            await conn.login(activeEnvironment.username, passwordWithToken);
            const result = await conn.query<SalesforceRecord>(query) as QueryResult;
            showQueryResults(result);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Query failed: ${errorMessage}`);
        }
    });

    context.subscriptions.push(
        environmentsView,
        addEnvironmentCommand,
        removeEnvironmentCommand,
        setActiveEnvironmentCommand,
        runQueryCommand
    );
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
    if (activeConnection) {
        activeConnection.logout();
    }
} 