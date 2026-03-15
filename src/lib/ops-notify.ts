type NotifyOptions = {
  text: string;
  event?: string;
  payload?: Record<string, unknown>;
};

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram send failed (${response.status}): ${body}`);
  }
}

export async function notifyOpsChannels({ text, event, payload }: NotifyOptions) {
  const telegramAdminIds = (process.env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const openclawToken = process.env.OPENCLAW_BOT_TOKEN;
  const openclawChatId = process.env.OPENCLAW_CHAT_ID;
  const openclawWebhookUrl = process.env.OPENCLAW_WEBHOOK_URL;
  const openclawWebhookToken = process.env.OPENCLAW_WEBHOOK_TOKEN;

  const tasks: Promise<unknown>[] = [];

  if (telegramBotToken && telegramAdminIds.length > 0) {
    for (const adminId of telegramAdminIds) {
      tasks.push(sendTelegramMessage(telegramBotToken, adminId, text));
    }
  }

  if (openclawToken && openclawChatId) {
    tasks.push(sendTelegramMessage(openclawToken, openclawChatId, text));
  }

  if (openclawWebhookUrl) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (openclawWebhookToken) {
      headers.Authorization = `Bearer ${openclawWebhookToken}`;
    }

    tasks.push(
      fetch(openclawWebhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event: event || "ops.notification",
          occurredAt: new Date().toISOString(),
          text,
          payload: payload || null,
        }),
      }),
    );
  }

  const results = await Promise.allSettled(tasks);
  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => String(result.reason));

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}
