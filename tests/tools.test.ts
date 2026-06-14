import { describe, it, expect } from "vitest"
import { ToolRegistry, type Tool } from "../src/agent/tools"

const fakeTool: Tool = {
  name: "echo",
  description: "echoes",
  inputSchema: { type: "object", properties: {} },
  readOnly: true,
  run: async (input) => `got ${JSON.stringify(input)}`,
}

describe("ToolRegistry", () => {
  it("registers and retrieves tools", () => {
    const reg = new ToolRegistry().register(fakeTool)
    expect(reg.get("echo")).toBe(fakeTool)
    expect(reg.get("missing")).toBeUndefined()
  })

  it("exposes Anthropic-shaped definitions", () => {
    const reg = new ToolRegistry().register(fakeTool)
    expect(reg.definitions()).toEqual([
      { name: "echo", description: "echoes", input_schema: { type: "object", properties: {} } },
    ])
  })
})
