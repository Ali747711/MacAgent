import type { CommandRunner } from "../exec/command"
import type { Tool } from "../agent/tools"

const STATUS_COMMANDS: Record<string, string> = {
  battery: "pmset -g batt",
  disk: "df -h /",
  cpu: "top -l 1 -n 0",
  apps: "osascript -e 'tell application \"System Events\" to get name of (processes where background only is false)'",
}

export function createSystemStatusTool(run: CommandRunner): Tool {
  return {
    name: "system_status",
    description: "Read-only macOS status. 'what' is one of: battery, disk, cpu, apps.",
    inputSchema: {
      type: "object",
      properties: { what: { type: "string", enum: ["battery", "disk", "cpu", "apps"] } },
      required: ["what"],
    },
    readOnly: true,
    async run(input) {
      const what = String(input.what)
      const command = STATUS_COMMANDS[what]
      if (!command) return `Unknown status: ${what}`
      const { stdout, stderr } = await run(command)
      return (stdout || stderr || "(no output)").trim()
    },
  }
}
