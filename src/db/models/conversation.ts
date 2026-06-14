import { Schema, model } from "mongoose"
import type Anthropic from "@anthropic-ai/sdk"

interface TurnDoc {
  role: "user" | "assistant"
  content: string
}

const turnSchema = new Schema<TurnDoc>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
)

const ConversationTurn = model<TurnDoc>("ConversationTurn", turnSchema)

export async function saveTurn(role: "user" | "assistant", content: string): Promise<void> {
  await ConversationTurn.create({ role, content })
}

export async function loadRecentHistory(limit = 10): Promise<Anthropic.MessageParam[]> {
  const docs = await ConversationTurn.find().sort({ createdAt: -1 }).limit(limit)
  return docs
    .reverse()
    .map((d) => ({ role: d.role, content: d.content }))
}
