import { describe, it, expect, afterAll } from "vitest"
import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"
import { connectMongo } from "../src/db/connection"

let mem: MongoMemoryServer

afterAll(async () => {
  await mongoose.disconnect()
  if (mem) await mem.stop()
})

describe("connectMongo", () => {
  it("connects to a mongodb instance", async () => {
    mem = await MongoMemoryServer.create()
    await connectMongo(mem.getUri())
    expect(mongoose.connection.readyState).toBe(1) // connected
  })
})
