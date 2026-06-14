import { Bot, InputFile, type Context } from "grammy"
import Anthropic from "@anthropic-ai/sdk"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { loadConfig } from "./config"
import { isAuthorized } from "./bot/auth"
import { runCommand } from "./exec/command"
import { ToolRegistry } from "./agent/tools"
import { createClaudeClient } from "./agent/claude"
import { createSystemStatusTool } from "./tools/systemStatus"
import { createRunShellTool } from "./tools/runShell"
import { ConfirmationStore, confirmationKeyboard } from "./confirm/store"
import { handleMessage, handleDecision, type Replier, type OrchestratorDeps } from "./orchestrator"
import { connectMongo } from "./db/connection"
import { logAction } from "./db/models/audit"
import { saveTurn, loadRecentHistory } from "./db/models/conversation"
import { createOpenAppTool, createQuitAppTool } from "./tools/apps"
import { createRunShortcutTool } from "./tools/shortcut"

const config = loadConfig()

const SYSTEM_PROMPT = [
  "You are a personal assistant running on the owner's Mac, reachable over Telegram.",
  "Translate the owner's requests into tool calls. Prefer read-only tools for status questions.",
  "Use run_shell only when no other tool fits, and always give a clear one-line 'why'.",
  "Be concise in your replies — they are read on a phone.",
].join(" ")

const registry = new ToolRegistry()
  .register(createSystemStatusTool(runCommand))
  .register(createRunShellTool(runCommand))
  .register(createOpenAppTool(runCommand))
  .register(createQuitAppTool(runCommand))
  .register(createRunShortcutTool(runCommand))

const sdk = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY })
const deps: OrchestratorDeps = {
  client: createClaudeClient(sdk, registry, SYSTEM_PROMPT),
  registry,
  store: new ConfirmationStore(),
  audit: (e) => logAction({ userMessage: "", ...e }),
  history: { load: () => loadRecentHistory(10), save: saveTurn },
}

const bot = new Bot(config.BOT_TOKEN)

bot.use(async (ctx, next) => {
  if (isAuthorized(ctx.from?.id, config.ALLOWED_USER_ID)) await next()
})

function replier(ctx: Context): Replier {
  return {
    reply: (text) => ctx.reply(text),
    sendConfirmation: (text, id) =>
      ctx.reply(text, { parse_mode: "Markdown", reply_markup: confirmationKeyboard(id) }),
  }
}

bot.command("screenshot", async (ctx) => {
  try {
    const path = join(tmpdir(), `shot-${randomUUID()}.png`)
    const { code, stderr } = await runCommand(`screencapture -x ${path}`)
    if (code !== 0) {
      await ctx.reply(`Failed to capture screenshot: ${stderr}`)
      return
    }
    await ctx.replyWithPhoto(new InputFile(path))
  } catch (error) {
    console.error("screenshot failed:", error)
    await ctx.reply("Couldn't take a screenshot.")
  }
})

bot.callbackQuery(/^(approve|deny):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery()
  const decision = ctx.match[1] === "approve" ? "approve" : "deny"
  try {
    await handleDecision(decision, ctx.match[2], replier(ctx), deps)
  } catch (error) {
    console.error("handleDecision failed:", error)
    await ctx.reply("Something went wrong running that action.")
  }
})

bot.on("message:text", async (ctx) => {
  try {
    await handleMessage(ctx.message.text, replier(ctx), deps)
  } catch (error) {
    console.error("handleMessage failed:", error)
    await ctx.reply("Something went wrong handling that. Please try again.")
  }
})

await connectMongo(config.MONGODB_URI)
bot.start()
console.error("Bot started (long-polling).")
