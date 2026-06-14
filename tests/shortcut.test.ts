import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"
import { Shortcut } from "../src/db/models/shortcut"
import { createRunShortcutTool } from "../src/tools/shortcut"

let mem: MongoMemoryServer
beforeAll(async () => {
  mem = await MongoMemoryServer.create()
  await mongoose.connect(mem.getUri())
})
afterAll(async () => {
  await mongoose.disconnect()
  await mem.stop()
})

describe("run_shortcut tool", () => {
  it("looks up a saved shortcut and runs its command", async () => {
    await Shortcut.create({ name: "backup", command: "echo backing up", description: "demo" })
    const run = vi.fn().mockResolvedValue({ stdout: "backing up", stderr: "", code: 0 })
    const tool = createRunShortcutTool(run)
    expect(tool.readOnly).toBe(false)
    const out = await tool.run({ name: "backup" })
    expect(run).toHaveBeenCalledWith("echo backing up")
    expect(out).toContain("backing up")
  })

  it("reports an unknown shortcut", async () => {
    const tool = createRunShortcutTool(vi.fn())
    expect(await tool.run({ name: "nope" })).toMatch(/No shortcut named/)
  })
})
