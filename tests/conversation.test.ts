import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"
import { saveTurn, loadRecentHistory } from "../src/db/models/conversation"

let mem: MongoMemoryServer
beforeAll(async () => {
  mem = await MongoMemoryServer.create()
  await mongoose.connect(mem.getUri())
})
afterAll(async () => {
  await mongoose.disconnect()
  await mem.stop()
})

describe("conversation history", () => {
  it("saves turns and loads them oldest-first, capped", async () => {
    await saveTurn("user", "first")
    await saveTurn("assistant", "second")
    const history = await loadRecentHistory(10)
    expect(history.map((t) => t.content)).toEqual(["first", "second"])
    expect(history[0].role).toBe("user")
  })
})
