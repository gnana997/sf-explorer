# Salesforce SOQL Query Runner VSCode Extension

This VSCode extension allows you to run SOQL queries directly from your editor. It provides a simple interface to authenticate with Salesforce and execute queries, displaying the results in a nicely formatted table.

## Features

- Support for multiple Salesforce environments (Production, Sandboxes, etc.)
- Secure credential storage using VSCode's global state
- Visual environment management in the side panel
- Execute SOQL queries directly from VSCode
- View query results in a formatted table
- Automatic connection management and status tracking
- Support for all standard SOQL queries

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Press F5 to start debugging or package the extension using `vsce package`

## Usage

1. Click the Salesforce icon in the activity bar to open the environments panel
2. Click the "+" button to add a new environment
3. Fill in the environment details:
   - Environment name (e.g., "Production", "Sandbox", "Dev")
   - Login URL (e.g., "https://login.salesforce.com" for production)
   - Username and password
4. Right-click on an environment to:
   - Set it as active
   - Remove it
5. Use the "Run SOQL Query" command to execute queries against the active environment

## Example Queries

```sql
SELECT Id, Name FROM Account LIMIT 10
SELECT Id, FirstName, LastName FROM Contact WHERE LastName LIKE 'A%'
SELECT Id, Name, Industry FROM Account WHERE Industry = 'Technology'
```

## Security Note

This extension stores your credentials securely in VSCode's global state. Credentials are only stored locally and are not transmitted to any external servers. The extension automatically handles connection management and provides visual indicators for stale connections.

## Requirements

- VSCode 1.85.0 or higher
- Node.js and npm installed
- Salesforce account with API access

## Changelog

### v0.0.1 (Initial Release)
- Added support for multiple Salesforce environments
- Implemented secure credential storage
- Added visual environment management in side panel
- Added connection status tracking
- Added automatic connection refresh
- Added warning indicators for stale connections
- Added support for custom login URLs (for sandboxes)
- Added modern webview forms for environment management
- Added query results display in formatted table

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License - see the LICENSE file for details. 