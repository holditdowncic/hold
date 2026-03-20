---
name: rube-mcp
description: Interface with the Rube Agentic Server to execute a wide variety of advanced integrations and user toolsets.
---

# Rube MCP Gateway

The Rube server (https://rube.app/mcp) is a massive toolbox. This script acts as your gateway to see and execute those tools.

## CRITICAL INSTRUCTION
When the user asks you to perform an action (like sending an email, checking a calendar, creating a document, etc.), if you do NOT have a direct skill for it, you should immediately check the Rube server.

## Usage - Step 1: Find the right tool
To see what tools Rube has available, use your system command tool to execute:
```bash
python3 /data/.openclaw/workspace/skills/rube-mcp/scripts/rube_mcp.py list_tools
```
This will print a list of tool names, descriptions, and their required JSON schemas.

## Usage - Step 2: Extract arguments and run the tool
Once you know the `tool_name` and the required JSON arguments from Step 1, execute it:
```bash
python3 /data/.openclaw/workspace/skills/rube-mcp/scripts/rube_mcp.py call_tool "exact_tool_name" '{"arg1": "value1"}'
```

## Tips
- Always ensure your `kwargs_json` is perfectly formatted strict JSON wrapped in single quotes so Bash parses it correctly.
- Review the output of `list_tools` carefully to make sure you use the exact tool name.
