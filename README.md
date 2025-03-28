# Salesforce Extension for VS Code

A Visual Studio Code extension that allows you to connect to Salesforce environments and run SOQL queries directly from your editor.

## Features

- 🔐 **Secure Login**: Connect to multiple Salesforce environments with secure credential storage
- 🌐 **Multi-Environment Support**: Manage multiple Salesforce environments (Production, Sandbox, etc.)
- 🔑 **Security Token Support**: Optional security token for enhanced authentication
- 🔌 **Connection Status**: Visual indicators for connection status (Connected, Stale, Disconnected)
- 📊 **SOQL Query Editor**: Write and execute SOQL queries with a dedicated editor
- 📋 **Query Results**: View query results in a clean, organized table format
- ⚡ **Real-time Feedback**: Get immediate feedback on query execution and connection status

## Installation

1. Open VS Code
2. Go to the Extensions view (Ctrl+Shift+X)
3. Search for "Salesforce Extension"
4. Click Install

## Usage

### Managing Environments

1. Click the Salesforce icon in the Activity Bar
2. Click the "+" button to add a new environment
3. Enter your environment details:
   - Name (e.g., "Production", "Sandbox")
   - Username
   - Password
   - Security Token (optional)
   - Instance URL (e.g., https://login.salesforce.com for production)

### Running Queries

1. Select an active environment from the Salesforce Explorer
2. Click the "Run SOQL Query" command from the command palette (Ctrl+Shift+P)
3. Enter your SOQL query in the editor
4. Click "Run Query" to execute
5. View results in the organized table format

## Commands

- `SFDC: Add Environment` - Add a new Salesforce environment
- `SFDC: Remove Environment` - Remove an existing environment
- `SFDC: Set Active Environment` - Set the currently active environment
- `SFDC: Disconnect Environment` - Disconnect from the current environment
- `SFDC: Run SOQL Query` - Open the SOQL query editor

## Changelog

### 0.0.5 (2024-03-21)
- ✨ Added dedicated SOQL query editor with syntax highlighting
- 📊 Implemented tabular view for query results
- 🔄 Added loading indicators for query execution
- ⚠️ Enhanced error handling and display
- 🔌 Added disconnect functionality for environments
- 🕒 Added connection status indicators (Connected, Stale, Disconnected)
- 🔐 Improved security with secure credential storage
- 🎨 Added VSCode theme-aware styling for better integration

### 0.0.4 (2024-03-20)
- 🎨 Added VSCode theme-aware styling for better integration
- 🔐 Improved security with secure credential storage
- 🕒 Added connection status indicators (Connected, Stale, Disconnected)
- 🔌 Added disconnect functionality for environments

### 0.0.3 (2024-03-19)
- 🔐 Added secure credential storage
- 🔑 Added support for security tokens
- 🌐 Added support for multiple environments
- 🎨 Added VSCode theme-aware styling

### 0.0.2 (2024-03-18)
- 🔐 Added basic authentication support
- 🌐 Added support for multiple environments
- 🎨 Added VSCode theme-aware styling

### 0.0.1 (2024-03-17)
- 🎨 Added VSCode theme-aware styling
- 🔐 Added basic authentication support
- 🌐 Added support for multiple environments

## Requirements

- Visual Studio Code 1.60.0 or higher
- Node.js 14.0.0 or higher
- npm 6.0.0 or higher

## Extension Settings

This extension contributes the following settings:

* `sfdc-extension.environments`: List of configured Salesforce environments

## Known Issues

- None reported yet

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. 