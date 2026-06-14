const DENYLIST: RegExp[] = [
  /\brm\s+-[a-z]*r[a-z]*f?\s+\/(?:\s|$)/i, // rm -rf / (root)
  /\bmkfs\b/i,
  /\bdiskutil\s+(erase|reformat|partitionDisk)/i,
  /:\s*\(\s*\)\s*\{.*\}\s*;\s*:/, // fork bomb
  /\bdd\b[^\n]*\bof=\/dev\//i,
  />\s*\/dev\/disk\d/i,
]

export function isDenied(command: string): boolean {
  return DENYLIST.some((re) => re.test(command))
}

export function truncateOutput(text: string, max = 3500): string {
  if (text.length <= max) return text
  return text.slice(0, max) + `\n… (truncated, ${text.length - max} more chars)`
}
