import * as vscode from 'vscode';
import * as jsforce from 'jsforce';
import { EnvironmentFormProvider, EnvironmentFormData } from './environmentForm';
import { QueryEditorProvider } from './queryEditor';

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
            } else {
                treeItem.iconPath = new vscode.ThemeIcon('check');
                treeItem.tooltip = `Connected (Last: ${lastConnected.toLocaleString()})`;
            }
        } else {
            treeItem.iconPath = new vscode.ThemeIcon('plug');
            treeItem.tooltip = 'Not connected';
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

    async disconnectEnvironment(environment: SalesforceEnvironment) {
        environment.lastConnected = undefined;
        this.saveEnvironments();
        this._onDidChangeTreeData.fire();
        vscode.window.showInformationMessage(`Disconnected from environment: ${environment.name}`);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    showAddEnvironmentForm() {
        this.formProvider.show();
    }
}

let environmentProvider: SalesforceEnvironmentProvider;
let queryEditorProvider: QueryEditorProvider;
let activeConnection: jsforce.Connection | null = null;

export function activate(context: vscode.ExtensionContext) {
    environmentProvider = new SalesforceEnvironmentProvider(context);
    queryEditorProvider = new QueryEditorProvider(context.extensionUri, async (query: string) => {
        const activeEnvironment = environmentProvider.getActiveEnvironment();
        if (!activeEnvironment) {
            queryEditorProvider.showError('Please select an active environment first!');
            return;
        }

        const isConnected = await environmentProvider.refreshConnection(activeEnvironment);
        if (!isConnected) {
            queryEditorProvider.showError(`Failed to connect to environment: ${activeEnvironment.name}`);
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
            
            if (result.records.length > 0) {
                const fields = Object.keys(result.records[0]).filter(key => key !== 'attributes');
                queryEditorProvider.showResults(result.records, fields);
            } else {
                queryEditorProvider.showResults([], []);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            queryEditorProvider.showError(`Query failed: ${errorMessage}`);
        }
    });

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

    // Register disconnect environment command
    let disconnectEnvironmentCommand = vscode.commands.registerCommand('sfdc-extension.disconnectEnvironment', async (environment: SalesforceEnvironment) => {
        await environmentProvider.disconnectEnvironment(environment);
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
    let runQueryCommand = vscode.commands.registerCommand('sfdc-extension.runQuery', () => {
        queryEditorProvider.show();
    });

    context.subscriptions.push(
        environmentsView,
        addEnvironmentCommand,
        removeEnvironmentCommand,
        disconnectEnvironmentCommand,
        setActiveEnvironmentCommand,
        runQueryCommand
    );
}

export function deactivate() {
    if (activeConnection) {
        activeConnection.logout();
    }
} 