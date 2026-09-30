#!/usr/bin/env bun
/**
 * Enthymio MCP server (stdio) — lets agents search/save/get/delete vault items.
 * Run: bun run mcp   (or: bun mcp/src/server.ts)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { createItem, deleteItem, getItem, listItems } from "@/lib/items";
import { ITEM_TYPES } from "@/lib/types";
import { toYouTubeThumb } from "@/lib/youtube";

getDb();

const MCP_USER = process.env.ENTHYMIO_USER_ID ?? "";
if (!MCP_USER) {
  console.error("vault MCP: set ENTHYMIO_USER_ID to your Clerk user id (find it in Settings in the vault).");
  process.exit(1);
}

const server = new McpServer({ name: "enthymio", version: "0.1.0" });
const text = (v: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(v, null, 2) }],
});

server.registerTool(
  "vault_search",
  {
    title: "Search vault",
    description: "Search saved items by text query and/or type.",
    inputSchema: {
      query: z.string().optional().describe("Free-text search over title, notes, tags, url"),
      type: z.string().optional().describe("One of: image, bookmark, website, note, audio, video, youtube, or all"),
    },
  },
  async ({ query, type }) => text(listItems(MCP_USER, { query, type })),
);

server.registerTool(
  "vault_save",
  {
    title: "Save to Enthymio",
    description: "Save a bookmark, website, note, YouTube link, or a file already uploaded via the web app.",
    inputSchema: {
      type: z.enum(ITEM_TYPES).describe("Item type"),
      title: z.string().describe("Item title"),
      url: z.string().optional().describe("URL (required for bookmark/website/youtube)"),
      content: z.string().optional().describe("Note text / description"),
      mediaPath: z.string().optional().describe("Existing /api/files/... path for image/video/audio"),
      tags: z.array(z.string()).optional().describe("Tags"),
      collection: z.string().optional().describe("Collection/board name"),
    },
  },
  async ({ type, title, url, content, mediaPath, tags, collection }) => {
    try {
      const item = createItem(MCP_USER, {
        type, title, url, content, mediaPath,
        thumbnail: type === "youtube" && url ? (toYouTubeThumb(url) ?? null) : null,
        tags, collection,
      });
      return text(item);
    } catch (e) {
      return { ...text({ error: e instanceof Error ? e.message : "save failed" }), isError: true as const };
    }
  },
);

server.registerTool(
  "vault_get",
  {
    title: "Get vault item",
    description: "Fetch one item by id.",
    inputSchema: { id: z.string().describe("Item id") },
  },
  async ({ id }) => {
    const item = getItem(MCP_USER, id);
    return item ? text(item) : { ...text({ error: "not found" }), isError: true as const };
  },
);

server.registerTool(
  "vault_delete",
  {
    title: "Delete vault item",
    description: "Delete one item by id.",
    inputSchema: { id: z.string().describe("Item id") },
  },
  async ({ id }) => {
    deleteItem(MCP_USER, id);
    return text({ ok: true, id });
  },
);

await server.connect(new StdioServerTransport());
