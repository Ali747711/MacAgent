import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"
import { logAction, AuditLog } from "../src/db/models/audit"

let mem: MongoMemoryServer
beforeAll(async () => {
  mem = await MongoMemoryServer.create()
  await mongoose.connect(mem.getUri())
})
afterAll(async () => {
  await mongoose.disconnect()
  await mem.stop()
})

describe("logAction", () => {
  it("persists an audit entry", async () => {
    await logAction({ userMessage: "list files", toolName: "run_shell", input: { command: "ls" }, confirmed: true, result: "exit 0", isError: false })
    const entries = await AuditLog.find()
    expect(entries).toHaveLength(1)
    expect(entries[0].toolName).toBe("run_shell")
    expect(entries[0].confirmed).toBe(true)
  })
})
