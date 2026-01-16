import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const server = new Server(
    {
        name: "figma-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Handler for listing available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_figma_file",
                description: "Retrieves information about a Figma file using its file key",
                inputSchema: {
                    type: "object",
                    properties: {
                        fileKey: {
                            type: "string",
                            description: "The Figma file key from the URL (e.g., 'abc123def456' from figma.com/file/abc123def456/...)",
                        },
                    },
                    required: ["fileKey"],
                },
            },
        ],
    };
});

// Handler for executing tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "get_figma_file") {
        const { fileKey } = args;

        try {
            const res = await axios.get(
                `https://api.figma.com/v1/files/${fileKey}`,
                {
                    headers: {
                        "X-Figma-Token": process.env.FIGMA_TOKEN,
                    },
                }
            );

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(res.data, null, 2),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error fetching Figma file: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    }

    throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Figma MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
