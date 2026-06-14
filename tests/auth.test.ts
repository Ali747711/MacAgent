import { describe, it, expect } from "vitest"
import { isAuthorized } from "../src/bot/auth"

describe("isAuthorized", () => {
  it("accepts the allowlisted id", () => {
    expect(isAuthorized(42, 42)).toBe(true)
  })
  it("rejects a different id", () => {
    expect(isAuthorized(7, 42)).toBe(false)
  })
  it("rejects an undefined id", () => {
    expect(isAuthorized(undefined, 42)).toBe(false)
  })
})
