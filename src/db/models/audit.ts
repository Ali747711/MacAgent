import { Schema, model } from "mongoose"

export interface AuditEntry {
  userMessage: string
  toolName: string
  input: Record<string, unknown>
  confirmed: boolean
  result: string
  isError: boolean
}

const auditSchema = new Schema<AuditEntry>(
  {
    userMessage: { type: String, default: "" },
    toolName: { type: String, required: true },
    input: { type: Schema.Types.Mixed, default: {} },
    confirmed: { type: Boolean, required: true },
    result: { type: String, default: "" },
    isError: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const AuditLog = model<AuditEntry>("AuditLog", auditSchema)

export async function logAction(entry: AuditEntry): Promise<void> {
  await AuditLog.create(entry)
}
