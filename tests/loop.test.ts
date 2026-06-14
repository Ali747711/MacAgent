import { describe, it, expect } from "vitest"
import { runAgentLoop, continueAfterDecision } from "../src/agent/loop"
import { ToolRegistry, type Tool } from "../src/agent/tools"
import type { ClaudeClient, ClaudeResponse } from "../src/agent/claude"

function fakeClient(responses: ClaudeResponse[]): ClaudeClient {
  let i = 0
  return { async create() { return responses[i++] } }
}

const readOnlyTool: Tool = {
  name: "system_status", description: "", inputSchema: {}, readOnly: true,
  run: async () => "82%",
}
const shellTool: Tool = {
  name: "run_shell", description: "", inputSchema: {}, readOnly: false,
  run: async () => "done",
}
const registry = new ToolRegistry().register(readOnlyTool).register(shellTool)

describe("runAgentLoop", () => {
  it("returns done text when the model ends its turn", async () => {
    const client = fakeClient([
      { stop_reason: "end_turn", content: [{ type: "text", text: "hi there", citations: null }] as never },
    ])
    const result = await runAgentLoop([{ role: "user", content: "hi" }], client, registry)
    expect(result.type).toBe("done")
    if (result.type === "done") expect(result.text).toBe("hi there")
  })

  it("auto-runs a read-only tool then returns the final text", async () => {
    const client = fakeClient([
      { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: "system_status", input: { what: "battery" } }] as never },
      { stop_reason: "end_turn", content: [{ type: "text", text: "battery is 82%", citations: null }] as never },
    ])
    const result = await runAgentLoop([{ role: "user", content: "battery?" }], client, registry)
    expect(result.type).toBe("done")
    if (result.type === "done") expect(result.text).toBe("battery is 82%")
  })

  it("pauses for confirmation on a state-changing tool", async () => {
    const client = fakeClient([
      { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t2", name: "run_shell", input: { command: "ls" } }] as never },
    ])
    const result = await runAgentLoop([{ role: "user", content: "list files" }], client, registry)
    expect(result.type).toBe("needs_confirmation")
    if (result.type === "needs_confirmation") expect(result.toolUse.name).toBe("run_shell")
  })
})

describe("continueAfterDecision", () => {
  it("runs the tool on approve, then finishes", async () => {
    const client = fakeClient([
      { stop_reason: "end_turn", content: [{ type: "text", text: "ran it", citations: null }] as never },
    ])
    const toolUse = { id: "t2", name: "run_shell", input: { command: "ls" } }
    const result = await continueAfterDecision(
      [{ role: "user", content: "x" }], toolUse, "approve", client, registry,
    )
    expect(result.type).toBe("done")
    if (result.type === "done") expect(result.text).toBe("ran it")
  })

  it("feeds a decline back to the model on deny", async () => {
    const client = fakeClient([
      { stop_reason: "end_turn", content: [{ type: "text", text: "ok, cancelled", citations: null }] as never },
    ])
    const toolUse = { id: "t2", name: "run_shell", input: { command: "ls" } }
    const result = await continueAfterDecision(
      [{ role: "user", content: "x" }], toolUse, "deny", client, registry,
    )
    expect(result.type).toBe("done")
    if (result.type === "done") expect(result.text).toBe("ok, cancelled")
  })
})
