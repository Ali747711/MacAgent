export function isAuthorized(userId: number | undefined, allowedId: number): boolean {
  return userId !== undefined && userId === allowedId
}
