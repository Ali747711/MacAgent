import { describe, it, expect, vi } from "vitest"
import { createClaudeClient } from "../src/agent/claude"
import { ToolRegistry } from "../src/agent/tools"

describe("createClaudeClient", () => {
  it("calls the SDK with model, tools, and disabled parallel tool use", async () => {
    const create = vi.fn().mockResolvedValue({ content: [], stop_reason: "end_turn" })
    const fakeSdk = { messages: { create } } as unknown as import("@anthropic-ai/sdk").default
    const registry = new ToolRegistry()
    const client = createClaudeClient(fakeSdk, registry, "sys")

    await client.create([{ role: "user", content: "hi" }])

    expect(create).toHaveBeenCalledOnce()
    const arg = create.mock.calls[0][0]
    expect(arg.model).toBe("claude-opus-4-8")
    expect(arg.system).toBe("sys")
    expect(arg.tool_choice).toEqual({ type: "auto", disable_parallel_tool_use: true })
  })
})
