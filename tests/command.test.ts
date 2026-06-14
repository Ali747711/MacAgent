import { describe, it, expect } from "vitest"
import { runCommand } from "../src/exec/command"

describe("runCommand", () => {
  it("captures stdout and a zero exit code", async () => {
    const result = await runCommand("echo hello")
    expect(result.stdout.trim()).toBe("hello")
    expect(result.code).toBe(0)
  })

  it("reports a non-zero exit code for a failing command", async () => {
    const result = await runCommand("exit 3")
    expect(result.code).toBe(3)
  })
})
