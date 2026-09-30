# Enthymio MCP server

Exposes your vault to AI agents over MCP (stdio).

## Tools

| Tool | Purpose |
|------|---------|
| `vault_search` | Search by text + optional type filter |
| `vault_save` | Save bookmark/website/note/youtube/file ref |
| `vault_get` | Fetch one item by id |
| `vault_delete` | Delete one item by id |

## Run

```powershell
bun run mcp
```

## Connect an agent

Copy `config.example.json` into your client's MCP config (Claude Desktop, opencode, etc.)
and adjust the absolute paths. The server reads the same `./data/enthymio.db` as the web app,
so no extra setup is needed — just point `cwd` at the repo root.
