import { describe, it, expect } from "vitest"
import { loadConfig } from "../src/config"

const validEnv = {
  BOT_TOKEN: "tok",
  ANTHROPIC_API_KEY: "key",
  ALLOWED_USER_ID: "12345",
  MONGODB_URI: "mongodb://localhost/test",
}

describe("loadConfig", () => {
  it("parses and coerces a valid environment", () => {
    const cfg = loadConfig(validEnv)
    expect(cfg.ALLOWED_USER_ID).toBe(12345)
    expect(cfg.BOT_TOKEN).toBe("tok")
  })

  it("defaults MONGODB_URI when missing", () => {
    const { MONGODB_URI, ...noMongo } = validEnv
    expect(loadConfig(noMongo).MONGODB_URI).toBe("mongodb://127.0.0.1:27017/bot")
  })

  it("throws when a required key is missing", () => {
    const { BOT_TOKEN, ...noToken } = validEnv
    expect(() => loadConfig(noToken)).toThrow(/Invalid configuration/)
  })
})
