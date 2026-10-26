/** Development scaffold only. No authentication, OAuth exchange, tokens or AI calls. */
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
export function createApiServer() {
  return createServer((req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const send = (status, body) => {
      res.writeHead(status);
      res.end(JSON.stringify(body));
    };
    if (url.pathname === "/api/health" && req.method === "GET")
      return send(200, {
        status: "ok",
        mode: "scaffold",
        oauthEnabled: false,
        externalCallsEnabled: false,
      });
    if (url.pathname === "/api/integrations" && req.method === "GET")
      return send(200, {
        mode: "scaffold",
        integrations: [],
        connectedCount: 0,
        message:
          "No provider adapters configured. Frontend directory entries are links only.",
      });
    if (
      /^\/api\/oauth\/[^/]+\/(start|callback)$/.test(url.pathname) ||
      url.pathname === "/api/workflows/execute"
    ) {
      req.resume();
      return send(501, {
        code: "NOT_IMPLEMENTED",
        message:
          "OAuth and workflow execution are not implemented. No credentials accepted or external services called.",
      });
    }
    send(404, { code: "NOT_FOUND" });
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const port = Number(process.env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error("Invalid PORT");
  createApiServer().listen(port, "127.0.0.1", () =>
    console.log(
      `Backend scaffold listening on 127.0.0.1:${port}; integrations disabled`,
    ),
  );
}
