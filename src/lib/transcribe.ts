import OpenAI from "openai";

/**
 * Transcribe a voice message using Gemini 3 Flash via OpenRouter.
 * Sends audio as base64 multimodal content — no extra API keys needed.
 */
export async function transcribeVoice(audioBuffer: ArrayBuffer, mimeType = "audio/ogg"): Promise<string | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error("OPENROUTER_API_KEY not set");
        return null;
    }

    const client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        defaultHeaders: {
            "HTTP-Referer": "https://holditdown.org",
            "X-Title": "Hold It Down CMS Bot",
        },
    });

    try {
        const base64Audio = Buffer.from(audioBuffer).toString("base64");
        const dataUrl = `data:${mimeType};base64,${base64Audio}`;

        const response = await client.chat.completions.create({
            model: "google/gemini-3-flash-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Transcribe this voice message exactly as spoken. Output ONLY the transcribed text, nothing else. No quotes, no labels, no explanation.",
                        },
                        {
                            type: "image_url",
                            image_url: { url: dataUrl },
                        },
                    ],
                },
            ],
            max_tokens: 500,
            temperature: 0,
        });

        const text = response.choices?.[0]?.message?.content?.trim();
        return text || null;
    } catch (error) {
        console.error("Voice transcription error:", error);
        return null;
    }
}
