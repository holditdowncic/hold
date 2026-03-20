---
name: supermemory-memory
description: Recall relevant long-term user context from Supermemory before natural chat replies, then store meaningful turns after replying.
---

# Supermemory Memory
Use this only for normal conversation. Do not use it for n8n workflow commands or inline button callbacks.

## Recall
Before replying to a meaningful natural-language message, fetch relevant memory:

`python3 /data/.openclaw/workspace/skills/supermemory-memory/scripts/get_context.py --chat-id "<CHAT_ID>" --user-id "<USER_ID>" --query "<USER_MESSAGE>"`

Use the returned JSON silently as hidden context. If `configured` is false or the summary is empty, continue normally without mentioning it.

## Store
After deciding your final reply, store the turn:

`python3 /data/.openclaw/workspace/skills/supermemory-memory/scripts/store_turn.py --chat-id "<CHAT_ID>" --user-id "<USER_ID>" --message-id "<MESSAGE_ID>" --user-message "<USER_MESSAGE>" --assistant-message "<FINAL_REPLY>"`

The store script only skips slash commands, transport metadata, and empty/noise turns. Let Supermemory decide what is worth retaining from normal chat. Do not mention Supermemory in chat unless the user explicitly asks about memory.
