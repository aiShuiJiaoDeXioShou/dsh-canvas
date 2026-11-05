/**
 * Host half entry for @local/dsh-canvas.
 *
 * The implementation lives in `lib/host/main.js` and is imported with a
 * cache-busting revision so a plugin disable/enable picks up Host changes
 * without restarting the whole desktop app.
 */

export const inject = ['webServer', 'tools', 'sessions', 'workingDirectory']

export async function apply(ctx) {
  const rev = Date.now().toString(36)
  const module = await import(new URL(`./lib/host/main.js?rev=${rev}`, import.meta.url))
  return module.apply(ctx)
}
