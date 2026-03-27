# 🪷 Denise Mascarenhas AI — Instituto Maha Lilah

IA baseada na metodologia de Denise Mascarenhas, com três formas de acesso:

- **API REST** — endpoint `/chat` para integrar em qualquer sistema
- **Bot Telegram** — converse com a Denise diretamente pelo Telegram
- **PWA** — interface web responsiva, instalável no celular

---

## Estrutura

```
brain-mahalilah/
├── server/               # Servidor Express + Claude API
│   ├── index.js
│   ├── package.json
│   └── data/
│       └── system-prompt.md   # Persona completa da Denise (72 casas, serpentes, flechas)
├── bot/                  # Bot Telegram (Telegraf.js)
│   ├── index.js
│   └── package.json
├── pwa/                  # Progressive Web App
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── .env.example
└── package.json          # Scripts raiz
```

---

## Pré-requisitos

- Node.js 20+
- Conta na [Anthropic](https://console.anthropic.com) com API key
- (Opcional) Token de bot Telegram via [@BotFather](https://t.me/BotFather)

---

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/marcosaccioly/brain-mahalilah.git
cd brain-mahalilah

# 2. Copie e preencha o .env
cp .env.example .env
# Edite .env e adicione ANTHROPIC_API_KEY (e TELEGRAM_BOT_TOKEN se quiser o bot)

# 3. Instale as dependências
npm run install:all
```

---

## Rodando localmente

### Só o servidor + PWA

```bash
npm run server
# ou em modo watch:
npm run server:dev
```

Acesse: `http://localhost:3000`

### Bot Telegram (em outro terminal)

```bash
npm run bot
```

---

## API REST

### `POST /chat`

```json
// Request
{
  "message": "*sessao",
  "session_id": "usuario-123"
}

// Response
{
  "response": "🪷 **Denise Mascarenhas...**",
  "session_id": "usuario-123"
}
```

### `GET /health`

Retorna `{ "status": "ok" }`.

### `DELETE /session/:id`

Limpa o histórico de conversa de uma sessão.

---

## Comandos da Denise

| Comando | O que faz |
|---------|-----------|
| `*sessao` | Sessão terapêutica completa de Maha Lilah |
| `*interpretar-casa {1-72}` | Interpretação profunda de uma casa |
| `*interpretar-serpente {1-10}` | Análise completa de uma serpente |
| `*interpretar-flecha {1-10}` | Análise completa de uma flecha |
| `*diagnostico-ego` | Diagnóstico Eneagrama × Maha Lilah |
| `*meditacao` | Meditação guiada |
| `*frase-poder` | Co-criar Frase de Poder |
| `*help` | Listar todos os comandos |

---

## Deploy (Railway / Render / Fly.io)

1. Faça o push do código para o GitHub
2. Crie um novo serviço apontando para este repositório
3. Configure as variáveis de ambiente (`ANTHROPIC_API_KEY`, `PORT`, etc.)
4. Defina o comando de start: `npm run server`

Para o bot Telegram em produção, rode como serviço separado com:
```bash
NODE_ENV=production npm run bot
```
E configure `SERVER_URL` apontando para o domínio do servidor.

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `ANTHROPIC_API_KEY` | Sim | Chave de API da Anthropic |
| `CLAUDE_MODEL` | Não | Modelo Claude (padrão: `claude-opus-4-6`) |
| `PORT` | Não | Porta do servidor (padrão: `3000`) |
| `TELEGRAM_BOT_TOKEN` | Só para o bot | Token do bot via @BotFather |
| `SERVER_URL` | Só para o bot | URL do servidor (padrão: `http://localhost:3000`) |
