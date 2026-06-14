import type { CommandRunner } from "../exec/command"
import type { Tool } from "../agent/tools"
import { isDenied, truncateOutput } from "../exec/guardrails"
import { Shortcut } from "../db/models/shortcut"

export function createRunShortcutTool(run: CommandRunner): Tool {
  return {
    name: "run_shortcut",
    description: "Run a saved, named shortcut command. Use list/save shortcuts via Telegram commands.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "The shortcut name" } },
      required: ["name"],
    },
    readOnly: false,
    async run(input) {
      const name = String(input.name)
      const shortcut = await Shortcut.findOne({ name })
      if (!shortcut) return `No shortcut named "${name}".`
      if (isDenied(shortcut.command)) return "Refused: shortcut matches a blocked dangerous pattern."
      const { stdout, stderr, code } = await run(shortcut.command)
      const body = (stdout || stderr || "(no output)").trim()
      return truncateOutput(`exit ${code}\n${body}`)
    },
  }
}
