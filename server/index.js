import Anthropic from "@anthropic-ai/sdk";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Carregar system prompt ────────────────────────────────────────────────────
const SYSTEM_PROMPT = readFileSync(
  join(__dirname, "data", "system-prompt.md"),
  "utf-8"
);

// ── Anthropic client ──────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Memória de sessão (in-memory) ─────────────────────────────────────────────
// { session_id: [ { role, content }, ... ] }
const sessions = new Map();

const MAX_HISTORY = 40; // máx. de mensagens por sessão (20 pares)

function getHistory(sessionId) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  return sessions.get(sessionId);
}

function appendToHistory(sessionId, role, content) {
  const history = getHistory(sessionId);
  history.push({ role, content });
  // Manter histórico dentro do limite (remove pares mais antigos)
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cors());

// Servir o PWA diretamente do servidor se existir a pasta pwa
import { existsSync } from "fs";
const pwaDir = join(__dirname, "..", "pwa");
if (existsSync(pwaDir)) {
  const { default: serveStatic } = await import("serve-static");
  app.use(serveStatic(pwaDir));
}

// ── POST /chat ────────────────────────────────────────────────────────────────
/**
 * Body: { message: string, session_id?: string }
 * Response: { response: string, session_id: string }
 */
app.post("/chat", async (req, res) => {
  const { message, session_id } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Campo 'message' é obrigatório." });
  }

  const sessionId = session_id || `default-${Date.now()}`;

  appendToHistory(sessionId, "user", message.trim());

  try {
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-opus-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: getHistory(sessionId),
    });

    const assistantText =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "(sem resposta)";

    appendToHistory(sessionId, "assistant", assistantText);

    return res.json({ response: assistantText, session_id: sessionId });
  } catch (err) {
    console.error("Erro na chamada Anthropic:", err.message);
    return res.status(500).json({ error: "Erro ao processar mensagem." });
  }
});

// ── GET /health ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── DELETE /session/:id ───────────────────────────────────────────────────────
app.delete("/session/:id", (req, res) => {
  sessions.delete(req.params.id);
  res.json({ deleted: true });
});

// ── Iniciar ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🪷 Denise Mascarenhas AI — servidor rodando na porta ${PORT}`);
});
