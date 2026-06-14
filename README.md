# MacAgent

A personal **AI Telegram bot that runs on your Mac** and takes actions on it while you're away. You message the bot in plain English — *"how's my battery?"*, *"clear my temp cache"*, *"open Telegram"* — and Claude interprets the request, runs read-only checks instantly, and asks for a tap-to-confirm before anything that changes your system.

> ⚠️ This bot can run shell commands on your machine. It is locked to a single Telegram user, confirms every state-changing action, and refuses a denylist of catastrophic commands — but treat it as what it is: remote access to your computer. Only run it for your own account.

## Features

- **Natural-language control** via Claude (`claude-opus-4-8`) tool-use.
- **Confirm-first safety** — read-only actions auto-run; anything that changes state waits behind ✅ Run / ❌ Cancel buttons.
- **Single-user allowlist** — the bot obeys only your Telegram user ID and silently ignores everyone else.
- **Guardrails** — a denylist blocks catastrophic commands (`rm -rf /`, disk formatting, fork bombs…) even after you confirm; command timeouts and output truncation included.
- **Persistence (MongoDB)** — audit log of every executed action, conversation history for multi-turn context, and saved named shortcuts.

## How it works

```
Telegram message → allowlist guard → Claude agentic loop (tool-use)
                                          │
                   read-only tool ────────┤──── auto-run, reply
                                          │
              state-changing tool ────────┴──── ✅/❌ confirmation → execute
```

Every executed action is written to an audit log, and conversation turns are stored so Claude has context across messages.

## Prerequisites

- **Node.js** 18+ (ES modules)
- **MongoDB** running locally (or a connection string to a remote instance)
- A **Telegram bot token** from [@BotFather](https://t.me/BotFather)
- An **Anthropic API key** from [console.anthropic.com](https://console.anthropic.com)
- Your **numeric Telegram user ID** — message [@userinfobot](https://t.me/userinfobot) to get it

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```
   BOT_TOKEN=<your telegram bot token>
   ANTHROPIC_API_KEY=<your anthropic api key>
   ALLOWED_USER_ID=<your numeric telegram user id>
   MONGODB_URI=mongodb://127.0.0.1:27017/bot
   ```

   `.env` is gitignored — never commit it.

3. Make sure MongoDB is running (e.g. `brew services start mongodb-community`).

## Running

```bash
npm start        # run the bot
npm run dev       # run with auto-reload (tsx watch)
```

You'll see `Bot started (long-polling).` Then message your bot.

## Usage

- **Ask in plain English:** `how's my battery?`, `how much disk space is left?`, `what apps are running?`, `open Safari`, `quit Telegram`, `clear my npm cache`.
- **`/screenshot`** — capture and receive a screenshot of your Mac's screen.
- For state-changing actions, the bot replies with the exact command it intends to run and waits for you to tap **✅ Run** or **❌ Cancel**.

### Tools the assistant can use

| Tool | Action | Confirmation |
|---|---|---|
| `system_status` | battery / disk / CPU / running apps | auto-run (read-only) |
| `run_shell` | run a shell command | required |
| `open_app` / `quit_app` | open or quit a macOS app | required |
| `run_shortcut` | run a saved named shortcut | required |

Saved shortcuts live in MongoDB (`shortcuts` collection: `{ name, command, description }`).

## Security model

- **Allowlist:** middleware drops every update whose sender isn't `ALLOWED_USER_ID`.
- **Confirm-first:** the LLM never executes a state-changing action without your explicit button tap.
- **Denylist:** the executor refuses catastrophic command patterns regardless of confirmation.
- **No privilege escalation:** commands run as your user; `sudo` is never added.
- **Audit log:** every proposed/executed action, its arguments, whether you confirmed, and the result are recorded in MongoDB.

## Testing

```bash
npm test          # run the vitest suite
npm run typecheck  # tsc --noEmit
```

## Tech stack

TypeScript (ESM) · [grammy](https://grammy.dev) (Telegram, long-polling) · [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript) · [mongoose](https://mongoosejs.com) · [zod](https://zod.dev) (config validation) · [vitest](https://vitest.dev) + mongodb-memory-server · tsx

## Project structure

```
src/
  config.ts            env loading + validation (zod)
  index.ts             entrypoint: wires the bot
  bot/auth.ts          allowlist guard
  agent/               Claude client, tool registry, agentic loop
  exec/                command runner + guardrails (denylist, truncation)
  tools/               system_status, run_shell, apps, shortcut
  confirm/             confirmation store + rendering
  orchestrator.ts      bridges Telegram, the loop, and persistence
  db/                  mongoose connection + models (audit, conversation, shortcut)
```
