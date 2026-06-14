import type { CommandRunner } from "../exec/command"
import type { Tool } from "../agent/tools"
import { isDenied, truncateOutput } from "../exec/guardrails"

export function createRunShellTool(run: CommandRunner): Tool {
  return {
    name: "run_shell",
    description:
      "Run a shell command on the user's Mac. Use only for actions not covered by other tools. Always include a one-line 'why' that will be shown to the user for confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command to run" },
        why: { type: "string", description: "One-line reason, shown to the user" },
      },
      required: ["command", "why"],
    },
    readOnly: false,
    async run(input) {
      const command = String(input.command)
      if (isDenied(command)) {
        return "Refused: command matches a blocked dangerous pattern."
      }
      const { stdout, stderr, code } = await run(command)
      const body = (stdout || stderr || "(no output)").trim()
      return truncateOutput(`exit ${code}\n${body}`)
    },
  }
}
