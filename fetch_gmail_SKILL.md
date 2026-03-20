---
name: fetch-gmail
description: Fetch recent emails from the user's Gmail account using Composio. Use when the user expressly asks to read, check, fetch, or summarize their recent emails.
---

# Fetch Gmail Connector

Executes the `GMAIL_FETCH_EMAILS` action via the Composio SDK to check the user's connected Gmail account.

## CRITICAL INSTRUCTION
When the user asks to fetch their emails, immediately execute the Python script below. DO NOT ask them for a use case. DO NOT attempt to generate an OAuth link (unless the script below specifically returns an error telling you they need to authenticate).

## Usage

Use your system command/shell tool to execute:
```bash
python3 /data/.openclaw/workspace/skills/fetch-gmail/scripts/fetch_gmail.py
```

## Output
Returns a JSON-formatted list of recent emails. You should read this output and summarize the emails in a helpful way for the user directly in chat. If there is an authentication error, the script will let you know.
