/**
 * Host half entry for @local/dsh-canvas.
 *
 * The implementation is built to dist/host/main.js and imported with a
 * cache-busting revision so plugin disable/enable picks up Host changes
 * without restarting the desktop app.
 */

export const inject = ['webServer', 'tools', 'sessions', 'workingDirectory']

export async function apply(ctx) {
  const rev = Date.now().toString(36)
  const module = await import(new URL(`./dist/host/main.js?rev=${rev}`, import.meta.url))
  return module.apply(ctx)
}
