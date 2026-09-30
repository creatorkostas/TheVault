#!/usr/bin/env bun
/**
 * vault.exe — double-click launcher for Enthymio.
 * Starts the Next.js server from the app root, opens the browser.
 * Flags: --port 3000 --no-browser --root <dir> --disable-types video,audio
 */
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string): string => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const PORT = flag("--port", process.env.PORT ?? "3000");
const NO_BROWSER = args.includes("--no-browser");
const DISABLED = flag("--disable-types", process.env.ENTHYMIO_DISABLED_TYPES ?? "");
if (DISABLED) process.env.ENTHYMIO_DISABLED_TYPES = DISABLED;

const ROOT =
  flag("--root", "") ||
  (import.meta.dir.endsWith("packaging")
    ? join(import.meta.dir, "..")
    : join(process.execPath, ".."));

const serverJs = Bun.file(join(ROOT, ".next", "standalone", "server.js"));
const useStandalone = await serverJs.exists();

const cmd = useStandalone
  ? ["bun", join(ROOT, ".next", "standalone", "server.js")]
  : ["bun", "run", "start", "--", "-p", PORT];

console.log(`Starting Enthymio on http://localhost:${PORT} …`);
const proc = Bun.spawn(cmd, {
  cwd: ROOT,
  env: { ...process.env, PORT, HOSTNAME: "127.0.0.1" },
  stdout: "inherit",
  stderr: "inherit",
});

const waitReady = async (): Promise<boolean> => {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/api/items`);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await Bun.sleep(1000);
  }
  return false;
};

if (await waitReady()) {
  console.log(`Enthymio is live: http://localhost:${PORT}`);
  if (!NO_BROWSER) {
    const opener =
      process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
    const openArgs =
      process.platform === "win32"
        ? ["/c", "start", `http://localhost:${PORT}`]
        : [`http://localhost:${PORT}`];
    Bun.spawn([opener, ...openArgs], { stdout: "ignore", stderr: "ignore" });
  }
} else {
  console.error("Server did not become ready in time.");
}

const shutdown = (): void => {
  proc.kill();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
await proc.exited;
