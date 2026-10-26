import { test } from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "./server.mjs";
test("scaffold reports readiness honestly and never pretends to execute OAuth/workflows", async () => {
  const server = createApiServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(base + "/api/health");
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      status: "ok",
      mode: "scaffold",
      oauthEnabled: false,
      externalCallsEnabled: false,
    });
    const integrations = await (await fetch(base + "/api/integrations")).json();
    assert.equal(integrations.connectedCount, 0);
    assert.deepEqual(integrations.integrations, []);
    for (const path of [
      "/api/oauth/chatgpt/start",
      "/api/oauth/chatgpt/callback",
      "/api/workflows/execute",
    ]) {
      const result = await fetch(base + path, { method: "POST" });
      assert.equal(result.status, 501);
      assert.equal((await result.json()).code, "NOT_IMPLEMENTED");
      assert.equal(result.headers.get("cache-control"), "no-store");
    }
    assert.equal((await fetch(base + "/api/no-such-route")).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
