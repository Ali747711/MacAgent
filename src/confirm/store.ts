import { randomUUID } from "node:crypto"
import { InlineKeyboard } from "grammy"
import type Anthropic from "@anthropic-ai/sdk"
import type { ToolUseRequest } from "../agent/loop"

export interface PendingConfirmation {
  messages: Anthropic.MessageParam[]
  toolUse: ToolUseRequest
  userMessage: string
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

// Telegram's Markdown parsers choke on the arbitrary characters that show up in
// shell commands and app names. Render as HTML instead and escape every dynamic
// value, wrapping verbatim content in <pre> so nothing can break the markup.
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function describeToolUse(toolUse: ToolUseRequest): string {
  if (toolUse.name === "run_shell") {
    const why = toolUse.input.why ? `\n${escapeHtml(String(toolUse.input.why))}` : ""
    return `I'll run:\n<pre>${escapeHtml(String(toolUse.input.command))}</pre>${why}`
  }
  const args = escapeHtml(JSON.stringify(toolUse.input, null, 2))
  return `I'll run <b>${escapeHtml(toolUse.name)}</b> with:\n<pre>${args}</pre>`
}
