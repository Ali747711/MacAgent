import { exec } from "node:child_process"

export interface CommandResult {
  stdout: string
  stderr: string
  code: number
}

export type CommandRunner = (command: string, timeoutMs?: number) => Promise<CommandResult>

export const runCommand: CommandRunner = (command, timeoutMs = 15000) =>
  new Promise((resolve) => {
    exec(command, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      const err = error as (Error & { code?: number }) | null
      const code = err && typeof err.code === "number" ? err.code : err ? 1 : 0
      resolve({ stdout, stderr, code })
    })
  })
