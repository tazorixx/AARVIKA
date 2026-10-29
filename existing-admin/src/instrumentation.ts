export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.AARVIKA_SHARED === 'true') {
      const { assertSharedServer } = await import('./lib/shared');
      assertSharedServer();
      return;
    } else {
      const { assertIsolatedServer } = await import('./lib/isolated');
      assertIsolatedServer();
    }
    // Covers existing HTTP provider functions without altering their UI/routes.
    const upstreamFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
        throw new Error("External service requests are disabled in the isolated admin.");
      }
      return upstreamFetch(input, { ...init, redirect: "error" });
    };
  }
}
