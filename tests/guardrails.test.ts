import { describe, it, expect } from "vitest"
import { isDenied, truncateOutput } from "../src/exec/guardrails"

describe("isDenied", () => {
  it.each([
    "rm -rf /",
    "sudo rm -rf / ",
    "mkfs.ext4 /dev/disk2",
    "dd if=/dev/zero of=/dev/disk0",
    ":(){ :|:& };:",
  ])("blocks dangerous command: %s", (cmd) => {
    expect(isDenied(cmd)).toBe(true)
  })

  it.each(["ls -la", "rm -rf ./node_modules", "echo hi"])(
    "allows safe command: %s",
    (cmd) => {
      expect(isDenied(cmd)).toBe(false)
    },
  )
})

describe("truncateOutput", () => {
  it("returns short text unchanged", () => {
    expect(truncateOutput("short", 100)).toBe("short")
  })
  it("truncates long text with a notice", () => {
    const out = truncateOutput("x".repeat(50), 10)
    expect(out.startsWith("x".repeat(10))).toBe(true)
    expect(out).toMatch(/truncated, 40 more chars/)
  })
})
