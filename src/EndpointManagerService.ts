import fs from "fs";
import http from "http";
import path from "path";
import type { IncomingMessage, ServerResponse } from "http";
import type { EndpointParameter, EndpointRequest, IManagedEndpoint } from "./types.js";

export class EndpointManagerService {
  private static instance: EndpointManagerService;
  private readonly endpoints = new Map<string, IManagedEndpoint>();

  private constructor() {}

  static getInstance(): EndpointManagerService {
    if (!EndpointManagerService.instance) {
      EndpointManagerService.instance = new EndpointManagerService();
    }
    return EndpointManagerService.instance;
  }

  register(): this {
    this.scanDir(path.join(__dirname, "api"));
    return this;
  }

  listen(port: number): this {
    http.createServer((req, res) => {
      this.handle(req, res).catch((err) => {
        console.error("[EMS] Unhandled error:", err);
        res.writeHead(500).end();
      });
    }).listen(port, () => console.log(`[EMS] Listening on port ${port}`));
    return this;
  }

  private scanDir(dir: string, base = ""): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryBase = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        this.scanDir(path.join(dir, entry.name), entryBase);
      } else if ((entry.name.endsWith(".ts") || entry.name.endsWith(".js")) && !entry.name.endsWith(".d.ts")) {
        const routeKey = entryBase.replace(/\.(ts|js)$/, "");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(path.join(dir, entry.name)) as { default?: new () => IManagedEndpoint };
        if (typeof mod.default === "function") {
          this.endpoints.set(routeKey, new mod.default());
          console.log(`[EMS] Registered /${routeKey}`);
        } else {
          console.warn(`[EMS] Skipping ${entry.name}: no default export class.`);
        }
      }
    }
  }

  private resolveRoute(urlPath: string): { endpoint: IManagedEndpoint; params: string[] } | null {
    const segments = urlPath.split("?")[0].replace(/^\/api\/?/, "").split("/").filter(Boolean);

    for (let i = segments.length; i >= 0; i--) {
      const endpoint = this.endpoints.get(segments.slice(0, i).join("/"));
      if (endpoint) return { endpoint, params: segments.slice(i) };
    }
    return null;
  }

  private mapEndpointParams(declared: EndpointParameter[], params: string[]): Record<string, string> {
    return Object.fromEntries(declared.slice(0, params.length).map((p, i) => [p.name, params[i]]));
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const match = this.resolveRoute(req.url ?? "");
    if (!match) {
      res.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const { endpoint, params } = match;

    if (endpoint.auth === "RESTRICTED") {
      res.writeHead(401, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const method = req.method?.toLowerCase() as keyof Pick<IManagedEndpoint, "get" | "post" | "put" | "delete">;
    const handler = endpoint[method];
    if (typeof handler !== "function") {
      res.writeHead(405, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const endpointParams = this.mapEndpointParams(endpoint.endpointParameters ?? [], params);
    for (const param of endpoint.endpointParameters ?? []) {
      if (param.requiredBy.includes(req.method ?? "") && !(param.name in endpointParams)) {
        res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: `Missing required parameter: ${param.name}` }));
        return;
      }
    }

    const urlParams: Record<string, string> = {};
    try {
      for (const [k, v] of new URL(req.url ?? "", "http://localhost").searchParams) urlParams[k] = v;
    } catch { /* ignore */ }

    for (const param of endpoint.urlParameters ?? []) {
      if (param.requiredBy.includes(req.method ?? "") && !(param.name in urlParams)) {
        res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: `Missing required URL parameter: ${param.name}` }));
        return;
      }
    }

    try {
      const result = await Promise.resolve(handler.call(endpoint, { endpointParams, urlParams } satisfies EndpointRequest));
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(result));
    } catch (err) {
      console.error("[EMS] Handler error:", err);
      res.writeHead(500, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Internal server error" }));
    }
  }
}
