import http from "http";
import type { IPresenceChecker } from "./types.js";

export function startApi(presenceChecker: IPresenceChecker): void {
  const server = http.createServer((req, res) => {
    const match = req.url?.match(/^\/api\/status\/(\d+)$/);

    if (!match) {
      res.writeHead(404).end();
      return;
    }

    const snowflake = match[1];

    const online = presenceChecker.isOnline(snowflake);
    res.writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify({ snowflake, online }));
  });

  server.listen(3005, () => console.log("[API] Listening on port 3005"));
}
