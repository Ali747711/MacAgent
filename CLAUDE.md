# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An early-stage **Telegram bot** project. Currently only an Express health-check server (`src/server.ts`) exists — the actual bot logic has not been built yet. The dependency set signals the intended stack: a Telegram bot backed by MongoDB with an HTTP server alongside it.

## Stack & key decisions

- **ESM-only**: `package.json` has `"type": "module"`. Use `import`/`export`, include file extensions in relative imports where Node requires them, and avoid CommonJS (`require`).
- **Telegram framework**: `grammy` is the modern framework to build on. `node-telegram-bot-api` is also installed but is the older/legacy alternative — prefer `grammy` for new bot code unless told otherwise.
- **Database**: `mongoose` (MongoDB).
- **HTTP server**: `express` v5 (note v5 behavior differs from v4 — e.g. stricter routing, async error handling).
- **Runtime**: TypeScript executed directly via `ts-node` + `nodemon` for reload. There is **no build step and no `tsconfig.json` yet** — add one before relying on type-checking or compilation.

## Running

No npm scripts are defined yet (`npm test` is a placeholder that exits 1). Run the server directly:

```bash
node --loader ts-node/esm src/server.ts   # or: npx nodemon --loader ts-node/esm src/server.ts
```

Server listens on `PORT` (default `3005`).

When adding scripts, wire up `dev` (nodemon + ts-node/esm) and a real `test`.

## Configuration

- Secrets live in `.env` (gitignored), loaded via `dotenv`. Currently holds `BOT_TOKEN` (Telegram bot token).
- `.env` is **not** auto-loaded yet — `src/server.ts` does not call `dotenv.config()`. Add it (or `import "dotenv/config"`) before reading `process.env` values.

## Vendored skill

`.agents/skills/telegram-bot/SKILL.md` is a pinned reference skill (tracked in `skills-lock.json`) covering Telegram bot development patterns. Consult it when implementing bot features.
