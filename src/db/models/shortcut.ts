import { Schema, model } from "mongoose"

export interface ShortcutDoc {
  name: string
  command: string
  description: string
}

const shortcutSchema = new Schema<ShortcutDoc>(
  {
    name: { type: String, required: true, unique: true },
    command: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true },
)

export const Shortcut = model<ShortcutDoc>("Shortcut", shortcutSchema)
