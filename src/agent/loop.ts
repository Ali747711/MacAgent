import type Anthropic from "@anthropic-ai/sdk"
import type { ClaudeClient } from "./claude"
import type { ToolRegistry } from "./tools"

export type AuditFn = (entry: {
  toolName: string
  input: Record<string, unknown>
  confirmed: boolean
  result: string
  isError: boolean
}) => Promise<void>

const noAudit: AuditFn = async () => {}

export interface ToolUseRequest {
  id: string
  name: string
  input: Record<string, unknown>
}

export type LoopResult =
  | { type: "done"; text: string; messages: Anthropic.MessageParam[] }
  | { type: "needs_confirmation"; toolUse: ToolUseRequest; messages: Anthropic.MessageParam[] }

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim()
}

export function toolResultMessage(
  toolUseId: string,
  content: string,
  isError = false,
): Anthropic.MessageParam {
  return {
    role: "user",
    content: [{ type: "tool_result", tool_use_id: toolUseId, content, is_error: isError }],
  }
}

export async function runAgentLoop(
  initial: Anthropic.MessageParam[],
  client: ClaudeClient,
  registry: ToolRegistry,
  audit: AuditFn = noAudit,
): Promise<LoopResult> {
  let messages = initial
  // Hard stop to prevent runaway loops if the model keeps calling read-only tools.
  for (let turn = 0; turn < 20; turn++) {
    const response = await client.create(messages)
    messages = [...messages, { role: "assistant", content: response.content }]

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    )
    if (response.stop_reason !== "tool_use" || !toolUse) {
      return { type: "done", text: extractText(response.content), messages }
    }

    const tool = registry.get(toolUse.name)
    if (!tool) {
      messages = [...messages, toolResultMessage(toolUse.id, `Unknown tool: ${toolUse.name}`, true)]
      continue
    }
    if (!tool.readOnly) {
      return {
        type: "needs_confirmation",
        toolUse: { id: toolUse.id, name: toolUse.name, input: toolUse.input as Record<string, unknown> },
        messages,
      }
    }
    const input = toolUse.input as Record<string, unknown>
    const result = await tool.run(input)
    await audit({ toolName: tool.name, input, confirmed: false, result, isError: false })
    messages = [...messages, toolResultMessage(toolUse.id, result)]
  }
  return { type: "done", text: "Stopped after too many steps.", messages }
}

export async function continueAfterDecision(
  messages: Anthropic.MessageParam[],
  toolUse: ToolUseRequest,
  decision: "approve" | "deny",
  client: ClaudeClient,
  registry: ToolRegistry,
  audit: AuditFn = noAudit,
): Promise<LoopResult> {
  if (decision === "deny") {
    const next = [...messages, toolResultMessage(toolUse.id, "User declined to run this action.", true)]
    return runAgentLoop(next, client, registry, audit)
  }
  const tool = registry.get(toolUse.name)
  let content: string
  let isError = false
  try {
    content = tool ? await tool.run(toolUse.input) : `Unknown tool: ${toolUse.name}`
    if (!tool) isError = true
  } catch (error) {
    content = `Error: ${(error as Error).message}`
    isError = true
  }
  await audit({ toolName: toolUse.name, input: toolUse.input, confirmed: true, result: content, isError })
  const next = [...messages, toolResultMessage(toolUse.id, content, isError)]
  return runAgentLoop(next, client, registry, audit)
}
