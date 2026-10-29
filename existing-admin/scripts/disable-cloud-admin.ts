/** The original project is preserved separately; copied CLI commands cannot use it. */
export function disableCloudAdminCommand(): never {
  throw new Error('Cloud admin bootstrap/verification is disabled in this copied workspace. Use scripts/seed-isolated.cjs for synthetic emulator users.');
}
