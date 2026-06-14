import { Bot } from "grammy"
import { loadConfig } from "./config"
import { isAuthorized } from "./bot/auth"
import { runCommand } from "./exec/command"
import { createSystemStatusTool } from "./tools/systemStatus"

const config = loadConfig()
const bot = new Bot(config.BOT_TOKEN)
const systemStatus = createSystemStatusTool(runCommand)

// Allowlist guard — drop everything from anyone but the owner.
bot.use(async (ctx, next) => {
  if (isAuthorized(ctx.from?.id, config.ALLOWED_USER_ID)) {
    await next()
  }
  // else: silently ignore
})

bot.command("status", async (ctx) => {
  const what = (ctx.match || "battery").trim()
  const result = await systemStatus.run({ what })
  await ctx.reply("```\n" + result + "\n```", { parse_mode: "Markdown" })
})

bot.start()
console.error("Bot started (long-polling).")
