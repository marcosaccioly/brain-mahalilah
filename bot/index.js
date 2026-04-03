import "dotenv/config";
import fetch from "node-fetch";
import { Telegraf } from "telegraf";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN não definido no .env");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ── Enviar mensagem ao servidor /chat ─────────────────────────────────────────
async function askDenise(sessionId, message) {
  const res = await fetch(`${SERVER_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Servidor retornou ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.response;
}

// ── /start ────────────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  const sessionId = `tg-${ctx.from.id}`;
  ctx.telegram.sendChatAction(ctx.chat.id, "typing");

  try {
    const greeting = await askDenise(
      sessionId,
      "/start — cumprimente-me como Padma"
    );
    await ctx.reply(greeting, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Erro no /start:", err.message);
    await ctx.reply(
      "🪷 Olá! Sou Padma. O servidor está iniciando — tente novamente em instantes."
    );
  }
});

// ── /reset — limpar histórico da sessão ──────────────────────────────────────
bot.command("reset", async (ctx) => {
  const sessionId = `tg-${ctx.from.id}`;
  await fetch(`${SERVER_URL}/session/${sessionId}`, { method: "DELETE" });
  await ctx.reply("🌀 Sessão reiniciada. Podemos começar um novo jogo.");
});

// ── /help ─────────────────────────────────────────────────────────────────────
bot.command("help", async (ctx) => {
  await ctx.reply(
    `🪷 *Padma — Maha Lilah*\n\n` +
      `Comandos do jogo:\n` +
      `• \`*sessao\` — Iniciar sessão terapêutica\n` +
      `• \`*interpretar-casa {1-72}\` — Interpretar uma casa\n` +
      `• \`*interpretar-serpente {1-10}\` — Interpretar uma serpente\n` +
      `• \`*interpretar-flecha {1-10}\` — Interpretar uma flecha\n` +
      `• \`*diagnostico-ego\` — Diagnóstico Eneagrama × Maha Lilah\n` +
      `• \`*meditacao\` — Meditação guiada\n` +
      `• \`*frase-poder\` — Criar Frase de Poder\n\n` +
      `Comandos do bot:\n` +
      `/reset — Reiniciar conversa\n` +
      `/help — Este menu`,
    { parse_mode: "Markdown" }
  );
});

// ── Mensagens de texto ────────────────────────────────────────────────────────
bot.on("text", async (ctx) => {
  const sessionId = `tg-${ctx.from.id}`;
  const userMessage = ctx.message.text;

  // Indicador de digitação
  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");

  try {
    const response = await askDenise(sessionId, userMessage);

    // Telegram tem limite de 4096 caracteres por mensagem
    if (response.length > 4000) {
      const chunks = response.match(/[\s\S]{1,4000}/g) || [response];
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: "Markdown" });
      }
    } else {
      await ctx.reply(response, { parse_mode: "Markdown" });
    }
  } catch (err) {
    console.error("Erro ao processar mensagem:", err.message);
    await ctx.reply(
      "⚠️ Ocorreu um erro ao processar sua mensagem. Tente novamente."
    );
  }
});

// ── Tratar erros ──────────────────────────────────────────────────────────────
bot.catch((err, ctx) => {
  console.error("Erro no bot:", err);
  ctx?.reply?.("⚠️ Erro interno. Tente novamente.").catch(() => {});
});

// ── Iniciar bot ───────────────────────────────────────────────────────────────
bot.launch().then(() => {
  console.log("🪷 Bot Telegram da Padma iniciado!");
});

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
