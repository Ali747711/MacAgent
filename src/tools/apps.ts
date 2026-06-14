import type { CommandRunner } from "../exec/command"
import type { Tool } from "../agent/tools"

export function createOpenAppTool(run: CommandRunner): Tool {
  return {
    name: "open_app",
    description: "Open a macOS application by name.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Application name, e.g. Safari" } },
      required: ["name"],
    },
    readOnly: false,
    async run(input) {
      const name = String(input.name)
      const { code, stderr } = await run(`open -a "${name}"`)
      return code === 0 ? `Opened ${name}.` : `Failed to open ${name}: ${stderr.trim()}`
    },
  }
}

export function createQuitAppTool(run: CommandRunner): Tool {
  return {
    name: "quit_app",
    description: "Quit a macOS application by name.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Application name, e.g. Safari" } },
      required: ["name"],
    },
    readOnly: false,
    async run(input) {
      const name = String(input.name)
      const { code, stderr } = await run(`osascript -e 'quit app "${name}"'`)
      return code === 0 ? `Quit ${name}.` : `Failed to quit ${name}: ${stderr.trim()}`
    },
  }
}
