import "dotenv/config"
import { z } from "zod"

const schema = z.object({
  BOT_TOKEN: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  ALLOWED_USER_ID: z.coerce.number().int().positive(),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/bot"),
})

export type Config = z.infer<typeof schema>

export function loadConfig(env: NodeJS.ProcessEnv | Record<string, unknown> = process.env): Config {
  const parsed = schema.safeParse(env)
  if (!parsed.success) {
    throw new Error(`Invalid configuration: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`)
  }
  return parsed.data
}
