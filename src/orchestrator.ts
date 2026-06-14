import type { ClaudeClient } from "./agent/claude"
import type { ToolRegistry } from "./agent/tools"
import { runAgentLoop, continueAfterDecision, type LoopResult } from "./agent/loop"
import { ConfirmationStore, describeToolUse } from "./confirm/store"

export interface Replier {
  reply(text: string): Promise<unknown>
  sendConfirmation(text: string, id: string): Promise<unknown>
}

export interface OrchestratorDeps {
  client: ClaudeClient
  registry: ToolRegistry
  store: ConfirmationStore
}

async function deliver(result: LoopResult, replier: Replier, deps: OrchestratorDeps): Promise<void> {
  if (result.type === "done") {
    await replier.reply(result.text || "(no response)")
    return
  }
  const id = deps.store.put({ messages: result.messages, toolUse: result.toolUse })
  await replier.sendConfirmation(describeToolUse(result.toolUse), id)
}

export async function handleMessage(text: string, replier: Replier, deps: OrchestratorDeps): Promise<void> {
  const result = await runAgentLoop([{ role: "user", content: text }], deps.client, deps.registry)
  await deliver(result, replier, deps)
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
  const result = await continueAfterDecision(pending.messages, pending.toolUse, decision, deps.client, deps.registry)
  await deliver(result, replier, deps)
}
