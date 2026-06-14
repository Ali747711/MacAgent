import { describe, it, expect } from "vitest"
import { ConfirmationStore, describeToolUse } from "../src/confirm/store"

describe("ConfirmationStore", () => {
  it("stores then returns-and-removes a pending confirmation", () => {
    const store = new ConfirmationStore()
    const id = store.put({ messages: [], toolUse: { id: "t", name: "run_shell", input: {} }, userMessage: "do it" })
    const taken = store.take(id)
    expect(taken?.toolUse.id).toBe("t")
    expect(store.take(id)).toBeUndefined() // consumed
  })
})

describe("describeToolUse", () => {
  it("formats a run_shell command into a code block", () => {
    const text = describeToolUse({ id: "t", name: "run_shell", input: { command: "ls -la", why: "list files" } })
    expect(text).toContain("ls -la")
    expect(text).toContain("list files")
  })

  it("formats other tools as json", () => {
    const text = describeToolUse({ id: "t", name: "quit_app", input: { name: "Safari" } })
    expect(text).toContain("quit_app")
    expect(text).toContain("Safari")
  })
})
