export const ADMIN_IDS = [123456789, 987654321];

export function isAdminId(id?: number): boolean {
  return id !== undefined && ADMIN_IDS.includes(id);
}
