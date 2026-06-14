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
  it("formats a run_shell command into an HTML code block", () => {
    const text = describeToolUse({ id: "t", name: "run_shell", input: { command: "ls -la", why: "list files" } })
    expect(text).toContain("<pre>ls -la</pre>")
    expect(text).toContain("list files")
    expect(text).not.toContain("**")
  })

  it("formats other tools as escaped HTML", () => {
    const text = describeToolUse({ id: "t", name: "quit_app", input: { name: "Safari" } })
    expect(text).toContain("<b>quit_app</b>")
    expect(text).toContain("Safari")
    expect(text).not.toContain("**")
  })

  it("escapes HTML metacharacters in dynamic content", () => {
    const text = describeToolUse({ id: "t", name: "run_shell", input: { command: 'echo "<b> & </pre>"', why: "x" } })
    expect(text).toContain("&lt;b&gt;")
    expect(text).toContain("&amp;")
    expect(text).not.toContain("<b>")
  })
})
