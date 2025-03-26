# Salesforce SOQL Query Runner VSCode Extension

This VSCode extension allows you to run SOQL queries directly from your editor. It provides a simple interface to authenticate with Salesforce and execute queries, displaying the results in a nicely formatted table.

## Features

- Salesforce authentication using username and password
- Execute SOQL queries directly from VSCode
- View query results in a formatted table
- Support for all standard SOQL queries

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Press F5 to start debugging or package the extension using `vsce package`

## Usage

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) to open the command palette
2. Type "SFDC: Login" and select it to authenticate with Salesforce
3. Enter your Salesforce username and password when prompted
4. Once logged in, you can run queries by:
   - Opening the command palette again
   - Typing "SFDC: Run Query" and selecting it
   - Enter your SOQL query when prompted
5. The results will be displayed in a new tab in a formatted table

## Example Queries

```sql
SELECT Id, Name FROM Account LIMIT 10
SELECT Id, FirstName, LastName FROM Contact WHERE LastName LIKE 'A%'
SELECT Id, Name, Industry FROM Account WHERE Industry = 'Technology'
```

## Security Note

This extension stores your credentials in memory only and logs out when the extension is deactivated. However, it's recommended to use a secure connection and follow Salesforce's security best practices.

## Requirements

- VSCode 1.85.0 or higher
- Node.js and npm installed
- Salesforce account with API access 