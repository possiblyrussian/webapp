export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { initDb } = await import('./lib/db');
      await initDb();
    } catch (err) {
      console.error('[instrumentation] DB init failed:', err);
    }
  }
}
