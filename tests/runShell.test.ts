import { describe, it, expect, vi } from "vitest"
import { createRunShellTool } from "../src/tools/runShell"

describe("run_shell tool", () => {
  it("is not read-only", () => {
    expect(createRunShellTool(vi.fn()).readOnly).toBe(false)
  })

  it("refuses denylisted commands without running them", async () => {
    const run = vi.fn()
    const tool = createRunShellTool(run)
    const out = await tool.run({ command: "rm -rf /", why: "cleanup" })
    expect(out).toMatch(/Refused/)
    expect(run).not.toHaveBeenCalled()
  })

  it("runs an allowed command and returns exit code + output", async () => {
    const run = vi.fn().mockResolvedValue({ stdout: "file1\nfile2", stderr: "", code: 0 })
    const tool = createRunShellTool(run)
    const out = await tool.run({ command: "ls", why: "list" })
    expect(run).toHaveBeenCalledWith("ls")
    expect(out).toBe("exit 0\nfile1\nfile2")
  })
})
