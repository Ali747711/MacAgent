import { describe, it, expect, vi } from "vitest"
import { handleMessage, handleDecision, type OrchestratorDeps } from "../src/orchestrator"
import { ConfirmationStore } from "../src/confirm/store"
import { ToolRegistry, type Tool } from "../src/agent/tools"
import type { ClaudeClient, ClaudeResponse } from "../src/agent/claude"

function fakeClient(responses: ClaudeResponse[]): ClaudeClient {
  let i = 0
  return { async create() { return responses[i++] } }
}
const shellTool: Tool = { name: "run_shell", description: "", inputSchema: {}, readOnly: false, run: async () => "done" }
const registry = new ToolRegistry().register(shellTool)

function deps(client: ClaudeClient): OrchestratorDeps {
  return { client, registry, store: new ConfirmationStore() }
}

describe("handleMessage", () => {
  it("replies with text when the loop finishes", async () => {
    const replier = { reply: vi.fn(), sendConfirmation: vi.fn() }
    const client = fakeClient([{ stop_reason: "end_turn", content: [{ type: "text", text: "hello", citations: null }] as never }])
    await handleMessage("hi", replier, deps(client))
    expect(replier.reply).toHaveBeenCalledWith("hello")
    expect(replier.sendConfirmation).not.toHaveBeenCalled()
  })

  it("sends a confirmation prompt when a state-changing tool is requested", async () => {
    const replier = { reply: vi.fn(), sendConfirmation: vi.fn() }
    const d = deps(fakeClient([
      { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t", name: "run_shell", input: { command: "ls", why: "list" } }] as never },
    ]))
    await handleMessage("list files", replier, d)
    expect(replier.sendConfirmation).toHaveBeenCalledOnce()
    const [text, id] = replier.sendConfirmation.mock.calls[0]
    expect(text).toContain("ls")
    expect(typeof id).toBe("string")
  })

  it("prepends loaded history and saves both turns on done", async () => {
    const create = vi.fn().mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "ok", citations: null }] as never })
    const client = { create } as unknown as ClaudeClient
    const save = vi.fn().mockResolvedValue(undefined)
    const d: OrchestratorDeps = {
      client, registry, store: new ConfirmationStore(),
      history: { load: async () => [{ role: "user", content: "earlier" }], save },
    }
    const replier = { reply: vi.fn(), sendConfirmation: vi.fn() }
    await handleMessage("now", replier, d)
    const sentMessages = create.mock.calls[0][0]
    expect(sentMessages[0]).toEqual({ role: "user", content: "earlier" })
    expect(sentMessages[sentMessages.length - 1]).toEqual({ role: "user", content: "now" })
    expect(save).toHaveBeenCalledWith("user", "now")
    expect(save).toHaveBeenCalledWith("assistant", "ok")
  })
})

describe("handleDecision", () => {
  it("runs the tool on approve and replies", async () => {
    const replier = { reply: vi.fn(), sendConfirmation: vi.fn() }
    const d = deps(fakeClient([{ stop_reason: "end_turn", content: [{ type: "text", text: "ran it", citations: null }] as never }]))
    const id = d.store.put({ messages: [{ role: "user", content: "x" }], toolUse: { id: "t", name: "run_shell", input: { command: "ls" } } })
    await handleDecision("approve", id, replier, d)
    expect(replier.reply).toHaveBeenCalledWith("ran it")
  })

  it("reports an expired confirmation", async () => {
    const replier = { reply: vi.fn(), sendConfirmation: vi.fn() }
    const d = deps(fakeClient([]))
    await handleDecision("approve", "missing-id", replier, d)
    expect(replier.reply).toHaveBeenCalledWith("This confirmation expired.")
  })

  it("saves the assistant turn to history when a confirmed action finishes", async () => {
    const replier = { reply: vi.fn(), sendConfirmation: vi.fn() }
    const save = vi.fn().mockResolvedValue(undefined)
    const d: OrchestratorDeps = {
      client: fakeClient([{ stop_reason: "end_turn", content: [{ type: "text", text: "all done", citations: null }] as never }]),
      registry, store: new ConfirmationStore(),
      history: { load: async () => [], save },
    }
    const id = d.store.put({ messages: [{ role: "user", content: "x" }], toolUse: { id: "t", name: "run_shell", input: { command: "ls" } } })
    await handleDecision("approve", id, replier, d)
    expect(save).toHaveBeenCalledWith("assistant", "all done")
  })
})
