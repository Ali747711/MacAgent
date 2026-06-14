import type Anthropic from "@anthropic-ai/sdk"

export interface Tool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  readOnly: boolean
  run: (input: Record<string, unknown>) => Promise<string>
}

export class ToolRegistry {
  private tools = new Map<string, Tool>()

  register(tool: Tool): this {
    this.tools.set(tool.name, tool)
    return this
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  definitions(): Anthropic.Tool[] {
    return [...this.tools.values()].map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }))
  }
}
