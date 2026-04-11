import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SYSTEM_PROMPT = readFileSync(
  join(__dirname, "data", "system-prompt.md"),
  "utf-8"
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_HISTORY = 40;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Campo 'message' é obrigatório." });
  }

  // Histórico enviado pelo cliente + nova mensagem do usuário
  const messages = [
    ...history.slice(-MAX_HISTORY),
    { role: "user", content: message.trim() },
  ];

  try {
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    const assistantText =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "(sem resposta)";

    // Retorna o histórico atualizado para o cliente guardar
    const updatedHistory = [
      ...messages,
      { role: "assistant", content: assistantText },
    ];

    return res.json({ response: assistantText, history: updatedHistory });
  } catch (err) {
    console.error("Erro Anthropic:", err.message);
    return res.status(500).json({ error: "Erro ao processar mensagem." });
  }
}
