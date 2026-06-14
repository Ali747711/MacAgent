import { randomUUID } from "node:crypto"
import { InlineKeyboard } from "grammy"
import type Anthropic from "@anthropic-ai/sdk"
import type { ToolUseRequest } from "../agent/loop"

export interface PendingConfirmation {
  messages: Anthropic.MessageParam[]
  toolUse: ToolUseRequest
}

export class ConfirmationStore {
  private pending = new Map<string, PendingConfirmation>()

  put(value: PendingConfirmation): string {
    const id = randomUUID()
    this.pending.set(id, value)
    return id
  }

  take(id: string): PendingConfirmation | undefined {
    const value = this.pending.get(id)
    this.pending.delete(id)
    return value
  }
}

export function confirmationKeyboard(id: string): InlineKeyboard {
  return new InlineKeyboard().text("✅ Run", `approve:${id}`).text("❌ Cancel", `deny:${id}`)
}

export function describeToolUse(toolUse: ToolUseRequest): string {
  if (toolUse.name === "run_shell") {
    const why = toolUse.input.why ? `\n_${String(toolUse.input.why)}_` : ""
    return `I'll run:\n\`\`\`\n${String(toolUse.input.command)}\n\`\`\`${why}`
  }
  return `I'll run **${toolUse.name}** with:\n\`\`\`json\n${JSON.stringify(toolUse.input, null, 2)}\n\`\`\``
}
