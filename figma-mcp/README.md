# Figma MCP Server

A Model Context Protocol (MCP) server that provides access to the Figma API, allowing AI assistants to interact with Figma files.

## Features

- **get_figma_file**: Retrieve detailed information about a Figma file using its file key

## Setup

### Prerequisites

- Node.js (v20 or later)
- A Figma Personal Access Token

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd figma-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the template:
```bash
cp .env.example .env
```

4. Add your Figma Personal Access Token to `.env`:
```
FIGMA_TOKEN=your_figma_personal_access_token_here
```

To get a Figma token:
- Go to your Figma account settings
- Navigate to "Personal Access Tokens"
- Generate a new token
- Copy and paste it into your `.env` file

## Running the Server

```bash
node server.js
```

The server will run on stdio (standard input/output) and can be connected to MCP-compatible clients like Claude Desktop.

## Usage with Claude Desktop

Add this server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "figma": {
      "command": "node",
      "args": ["/absolute/path/to/figma-mcp/server.js"],
      "env": {
        "FIGMA_TOKEN": "your_figma_token_here"
      }
    }
  }
}
```

## Available Tools

### get_figma_file

Retrieves information about a Figma file.

**Parameters:**
- `fileKey` (string): The Figma file key from the URL (e.g., 'abc123def456' from figma.com/file/abc123def456/...)

**Example:**
```
Get the file information for Figma file with key "abc123def456"
```

## Security Notes

⚠️ **Never commit your `.env` file or Figma token to version control!**

The `.gitignore` file is configured to exclude:
- `.env` files
- `node_modules/`
- Other sensitive or generated files

## License

MIT
