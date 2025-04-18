import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BilibiliService } from './bilibili-service.js';
import { z } from "zod";

// Initialize Bilibili service
const bilibiliService = new BilibiliService();

// Create MCP server
const server = new Server(
  {
    name: "bilibili-follower-count",
    version: "1.0.0"
  }, 
  {
    capabilities: {
      resources: {}
    }
  }
);

// Define schemas
const getResourceSchema = z.object({
  method: z.literal("resources/get"),
  params: z.object({
    uri: z.string()
  })
});

const listResourcesSchema = z.object({
  method: z.literal("resources/list")
});

// Define resource for Bilibili follower count
server.setRequestHandler(
  getResourceSchema,
  async (request) => {
    // Extract username from URI
    const uri = request.params.uri;
    if (!uri.startsWith('bilibili://user/')) {
      return { error: "Invalid resource URI" };
    }
    
    const username = uri.replace('bilibili://user/', '');
    console.log(`Retrieving follower count for username: ${username}`);
    
    const result = await bilibiliService.getFollowerCount(username);
    
    if (result.success) {
      return {
        uri,
        metadata: {
          title: `Bilibili User: ${username}`,
          contentType: "application/json"
        },
        content: JSON.stringify({
          username: username,
          followerCount: result.followerCount
        })
      };
    } else {
      return {
        uri,
        metadata: {
          title: `Error for ${username}`,
          contentType: "application/json"
        },
        content: JSON.stringify({
          username: username,
          error: result.error
        })
      };
    }
  }
);

// List available resources
server.setRequestHandler(
  listResourcesSchema, 
  async () => {
    return {
      resources: [
        {
          uri: "bilibili://user/example",
          name: "Get Bilibili Follower Count",
          description: "Get follower count for a Bilibili user. Replace 'example' with a username."
        }
      ]
    };
  }
);

// Connect to transport
async function main() {
  try {
    console.log("Starting Bilibili follower count MCP server...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("Connected to transport. Server is running.");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main(); 