import { describe, it, expect, vi } from "vitest"
import { createOpenAppTool, createQuitAppTool } from "../src/tools/apps"

describe("app tools", () => {
  it("open_app is confirm-gated and runs `open -a`", async () => {
    const run = vi.fn().mockResolvedValue({ stdout: "", stderr: "", code: 0 })
    const tool = createOpenAppTool(run)
    expect(tool.readOnly).toBe(false)
    await tool.run({ name: "Safari" })
    expect(run).toHaveBeenCalledWith('open -a "Safari"')
  })

  it("quit_app runs an osascript quit", async () => {
    const run = vi.fn().mockResolvedValue({ stdout: "", stderr: "", code: 0 })
    const tool = createQuitAppTool(run)
    await tool.run({ name: "Safari" })
    expect(run).toHaveBeenCalledWith('osascript -e \'quit app "Safari"\'')
  })

  it("open_app refuses names with shell metacharacters", async () => {
    const run = vi.fn()
    const tool = createOpenAppTool(run)
    const out = await tool.run({ name: 'Safari"; rm -rf ~ #' })
    expect(out).toMatch(/Refused/)
    expect(run).not.toHaveBeenCalled()
  })

  it("quit_app refuses names with shell metacharacters", async () => {
    const run = vi.fn()
    const tool = createQuitAppTool(run)
    const out = await tool.run({ name: "Safari'; reboot #" })
    expect(out).toMatch(/Refused/)
    expect(run).not.toHaveBeenCalled()
  })
})
