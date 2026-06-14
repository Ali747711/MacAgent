import type Anthropic from "@anthropic-ai/sdk"
import type { ToolRegistry } from "./tools"

export interface ClaudeResponse {
  content: Anthropic.ContentBlock[]
  stop_reason: string | null
}

export interface ClaudeClient {
  create(messages: Anthropic.MessageParam[]): Promise<ClaudeResponse>
}

export function createClaudeClient(
  sdk: Anthropic,
  registry: ToolRegistry,
  system: string,
): ClaudeClient {
  return {
    async create(messages) {
      const res = await sdk.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        system,
        tools: registry.definitions(),
        tool_choice: { type: "auto", disable_parallel_tool_use: true },
        messages,
      })
      return { content: res.content, stop_reason: res.stop_reason }
    },
  }
}
