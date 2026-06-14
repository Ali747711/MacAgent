import type Anthropic from "@anthropic-ai/sdk"
import type { ClaudeClient } from "./agent/claude"
import type { ToolRegistry } from "./agent/tools"
import { runAgentLoop, continueAfterDecision, type LoopResult, type AuditFn } from "./agent/loop"
import { ConfirmationStore, describeToolUse } from "./confirm/store"

export interface Replier {
  reply(text: string): Promise<unknown>
  sendConfirmation(text: string, id: string): Promise<unknown>
}

export interface AuditRecord {
  userMessage: string
  toolName: string
  input: Record<string, unknown>
  confirmed: boolean
  result: string
  isError: boolean
}

export interface OrchestratorDeps {
  client: ClaudeClient
  registry: ToolRegistry
  store: ConfirmationStore
  recordAction?: (entry: AuditRecord) => Promise<void>
  history?: {
    load: () => Promise<Anthropic.MessageParam[]>
    save: (role: "user" | "assistant", content: string) => Promise<void>
  }
}

// Build the loop's AuditFn by injecting the originating user message, which the
// loop itself doesn't know about. Returns undefined when no recorder is wired,
// so runAgentLoop falls back to its no-op default.
function auditFor(deps: OrchestratorDeps, userMessage: string): AuditFn | undefined {
  const record = deps.recordAction
  if (!record) return undefined
  return (entry) => record({ userMessage, ...entry })
}

async function deliver(
  result: LoopResult,
  replier: Replier,
  deps: OrchestratorDeps,
  userMessage: string,
): Promise<void> {
  if (result.type === "done") {
    await replier.reply(result.text || "(no response)")
    return
  }
  const id = deps.store.put({ messages: result.messages, toolUse: result.toolUse, userMessage })
  await replier.sendConfirmation(describeToolUse(result.toolUse), id)
}

export async function handleMessage(text: string, replier: Replier, deps: OrchestratorDeps): Promise<void> {
  const history = deps.history ? await deps.history.load() : []
  const initial: Anthropic.MessageParam[] = [...history, { role: "user", content: text }]
  if (deps.history) await deps.history.save("user", text)
  const result = await runAgentLoop(initial, deps.client, deps.registry, auditFor(deps, text))
  if (deps.history && result.type === "done") {
    await deps.history.save("assistant", result.text)
  }
  await deliver(result, replier, deps, text)
}

export async function handleDecision(
  decision: "approve" | "deny",
  id: string,
  replier: Replier,
  deps: OrchestratorDeps,
): Promise<void> {
  const pending = deps.store.take(id)
  if (!pending) {
    await replier.reply("This confirmation expired.")
    return
  }
  const result = await continueAfterDecision(
    pending.messages,
    pending.toolUse,
    decision,
    deps.client,
    deps.registry,
    auditFor(deps, pending.userMessage),
  )
  if (deps.history && result.type === "done") {
    await deps.history.save("assistant", result.text)
  }
  await deliver(result, replier, deps, pending.userMessage)
}
