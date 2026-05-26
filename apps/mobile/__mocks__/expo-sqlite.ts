export const openDatabaseSync = () => ({
  getFirstSync: () => ({ user_version: 0 }),
  withTransactionSync: (fn: () => void) => fn(),
  execSync: () => {},
  runSync: () => ({ changes: 0 }),
  getAllSync: () => [],
});
