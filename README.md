# Salesforce SOQL Query Runner VSCode Extension

A powerful VSCode extension for Salesforce developers that provides seamless integration with Salesforce orgs directly from your editor. This extension allows you to manage multiple Salesforce environments, explore object metadata, and execute SOQL queries with ease.

> **Preview Mode**: This extension is currently in preview and actively under development. While core features are stable, we're continuously adding new capabilities to enhance your Salesforce development experience.

## Features

### Current Features
- **Multi-Environment Support**
  - Connect to multiple Salesforce environments (Production, Sandboxes, etc.)
  - Secure credential storage using VSCode's global state
  - Visual environment management in the side panel
  - Automatic connection management and status tracking
  - Warning indicators for stale connections

- **SOQL Query Execution**
  - Run SOQL queries directly from VSCode
  - View query results in a formatted table
  - Support for all standard SOQL queries
  - Query history tracking

### Coming Soon
- **Object Explorer**
  - Browse Salesforce objects and their metadata
  - View field definitions and relationships
  - Explore object permissions and sharing rules
  - Quick access to object documentation

- **Data Export**
  - Export query results to CSV format
  - Customizable export options
  - Batch processing for large datasets

- **Additional Features**
  - Apex code execution
  - Deployment management
  - Custom metadata type explorer
  - Schema comparison between environments
  - Query builder with visual interface

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

### v0.0.1 (Preview Release)
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

We welcome contributions! Please feel free to submit a Pull Request. As this is a preview release, we're particularly interested in feedback and suggestions for new features.

## License

This extension is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

We're actively developing this extension with a focus on:
1. Object metadata exploration
2. Data export capabilities
3. Enhanced query building experience
4. Schema comparison tools
5. Deployment management features

Stay tuned for updates as we continue to enhance the extension with new features and improvements. 