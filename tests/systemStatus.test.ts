import { describe, it, expect, vi } from "vitest"
import { createSystemStatusTool } from "../src/tools/systemStatus"

describe("system_status tool", () => {
  it("runs the battery command and returns trimmed output", async () => {
    const run = vi.fn().mockResolvedValue({ stdout: "  82%  \n", stderr: "", code: 0 })
    const tool = createSystemStatusTool(run)
    const out = await tool.run({ what: "battery" })
    expect(run).toHaveBeenCalledWith("pmset -g batt")
    expect(out).toBe("82%")
    expect(tool.readOnly).toBe(true)
  })

  it("reports an unknown status target", async () => {
    const run = vi.fn()
    const tool = createSystemStatusTool(run)
    expect(await tool.run({ what: "nope" })).toMatch(/Unknown status/)
    expect(run).not.toHaveBeenCalled()
  })
})
