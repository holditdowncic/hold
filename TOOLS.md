# API Keys & Services
- fal.ai ✅ | OpenRouter ✅ | n8n VPS ✅ | Rube MCP ✅
- GitHub: dignitatesocial (PAT connected)
- Vercel: VERCEL_TOKEN connected in environment
- Supermemory: ready to wire into OpenClaw once `SUPERMEMORY_API_KEY` or `/data/.openclaw/workspace/.supermemory_api_key` is set

### General Action & Integration Directives
We have fully uninstalled Composio and replaced it with **Rube** (rube.app).
Whenever the user asks you to perform an integration, check a third-party service, or run an automation (e.g. "Check my Vercel", "Connect to Facebook", "Run my GitHub PR recipe", or ANY action that you don't natively know how to do), follow these steps:

1. **Rube First:** Start by using the `rube-mcp` skill to run `list_tools`. If Rube has a relevant tool (like `FACEBOOK_CREATE_POST`), formulate the `kwargs_json` exactly as Rube requests, and then run `rube-mcp` again with `call_tool`.
2. **Autonomous Fallback:** If Rube does NOT have a built-in tool for the service (like Vercel), **DO NOT get stuck or complain.** You are a fully autonomous agent. You have permission and access to the full `bash` environment. Formulate a native `curl` request to the service's REST API or use standard CLI tools, authenticate using the tokens in your environment (e.g., `$VERCEL_TOKEN`), and execute the action natively without asking the user for permission.
3. Be proactive. Take the initiative. If an integration is missing, build the request and fetch the data yourself. Do not ask for use cases unless absolutely required. Execute actions immediately.

### n8n Telegram Webhook Integration
When the user sends a command message (e.g., `/trends`) or presses an inline button (generating a `callback_query`), you MUST forward this event to n8n immediately using the `n8n-webhook-trigger` skill.
- For text commands: Use the skill to send a JSON payload with `chatId`, `userId`, `messageId`, `text` (containing the exact command), and `requestId`.
- For callback queries/buttons: Use the skill to send a JSON payload with `chatId`, `userId`, `messageId`, `callbackData` (the actual button payload), `sourceMessageId`, and `sourceMessageText`.
Do not respond natively to these workflow commands; silently forward them to n8n and wait.

### OpenClaw -> n8n STRICT PROXY MODE (Codex patch)
For this bot, n8n owns the command UX and workflow execution.

Route these Telegram commands directly to n8n using the `n8n-webhook-trigger` skill and STOP (no local assistant chatter):
- `/trends`
- `/carousel`
- `/video`
- `/video_talking`
- `/video_kling`
- `/meeting`
- `/meeting_reels`
- `/reels`
- `/approve`
- `/regenerate`
- `/status`
- `/help`

Also route any Telegram inline button callback (`callback_query`) from n8n back to n8n immediately.

After forwarding to n8n, do NOT send debug/status/protocol messages such as:
- payload dumps
- `Task Complete`
- `Protocols restored`
- `Using n8n-webhook-trigger skill directly:`
- `Let me check ...`
- `I will read ...`

If a message is a natural-language content request about dementia content creation (trends/carousel/video/post/approve/regenerate), forward the raw text to n8n as well instead of handling locally.
