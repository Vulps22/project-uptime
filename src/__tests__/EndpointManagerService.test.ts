import type { IncomingMessage, ServerResponse } from "http";
import { EndpointManagerService } from "../EndpointManagerService.js";
import type { IManagedEndpoint } from "../types.js";

function makeReq(method: string, url: string): IncomingMessage {
  return { method, url } as unknown as IncomingMessage;
}

function makeRes() {
  return {
    writeHead: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<ServerResponse>;
}

beforeEach(() => {
  (EndpointManagerService as unknown as { instance: unknown }).instance = undefined;
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("EndpointManagerService", () => {
  it("is a singleton", () => {
    expect(EndpointManagerService.getInstance()).toBe(EndpointManagerService.getInstance());
  });

  describe("handle — routing", () => {
    it("returns 404 for an unregistered route", async () => {
      const ems = EndpointManagerService.getInstance();
      const res = makeRes();
      await ems.handle(makeReq("GET", "/api/unknown"), res);
      expect(res.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
    });

    it("routes to the correct endpoint and returns 200", async () => {
      const ems = EndpointManagerService.getInstance();
      ems["endpoints"].set("status", {
        description: "test", auth: "PUBLIC",
        get: jest.fn().mockReturnValue({ ok: true }),
      } satisfies IManagedEndpoint);

      const res = makeRes();
      await ems.handle(makeReq("GET", "/api/status"), res);
      expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
    });

    it("resolves endpoint from partial path and treats remainder as params", async () => {
      const get = jest.fn().mockReturnValue({});
      EndpointManagerService.getInstance()["endpoints"].set("status", {
        description: "test", auth: "PUBLIC",
        endpointParameters: [{ name: "snowflake", type: "string", requiredBy: [] }],
        get,
      } satisfies IManagedEndpoint);

      await EndpointManagerService.getInstance().handle(makeReq("GET", "/api/status/123456789"), makeRes());
      expect(get).toHaveBeenCalledWith(expect.objectContaining({ endpointParams: { snowflake: "123456789" } }));
    });

    it("parses query string into urlParams", async () => {
      const get = jest.fn().mockReturnValue({});
      EndpointManagerService.getInstance()["endpoints"].set("status", {
        description: "test", auth: "PUBLIC", get,
      } satisfies IManagedEndpoint);

      await EndpointManagerService.getInstance().handle(makeReq("GET", "/api/status?foo=bar"), makeRes());
      expect(get).toHaveBeenCalledWith(expect.objectContaining({ urlParams: { foo: "bar" } }));
    });
  });

  describe("handle — auth", () => {
    it("returns 401 for a RESTRICTED endpoint", async () => {
      EndpointManagerService.getInstance()["endpoints"].set("secret", {
        description: "test", auth: "RESTRICTED",
        get: jest.fn(),
      } satisfies IManagedEndpoint);

      const res = makeRes();
      await EndpointManagerService.getInstance().handle(makeReq("GET", "/api/secret"), res);
      expect(res.writeHead).toHaveBeenCalledWith(401, expect.any(Object));
    });
  });

  describe("handle — method", () => {
    it("returns 405 when the method is not defined on the endpoint", async () => {
      EndpointManagerService.getInstance()["endpoints"].set("status", {
        description: "test", auth: "PUBLIC",
      } satisfies IManagedEndpoint);

      const res = makeRes();
      await EndpointManagerService.getInstance().handle(makeReq("GET", "/api/status"), res);
      expect(res.writeHead).toHaveBeenCalledWith(405, expect.any(Object));
    });
  });

  describe("handle — parameter validation", () => {
    it("returns 400 when a required endpoint param is missing", async () => {
      EndpointManagerService.getInstance()["endpoints"].set("status", {
        description: "test", auth: "PUBLIC",
        endpointParameters: [{ name: "snowflake", type: "string", requiredBy: ["GET"] }],
        get: jest.fn(),
      } satisfies IManagedEndpoint);

      const res = makeRes();
      await EndpointManagerService.getInstance().handle(makeReq("GET", "/api/status"), res);
      expect(res.writeHead).toHaveBeenCalledWith(400, expect.any(Object));
    });

    it("returns 400 when a required URL param is missing", async () => {
      EndpointManagerService.getInstance()["endpoints"].set("status", {
        description: "test", auth: "PUBLIC",
        urlParameters: [{ name: "token", type: "string", requiredBy: ["GET"] }],
        get: jest.fn(),
      } satisfies IManagedEndpoint);

      const res = makeRes();
      await EndpointManagerService.getInstance().handle(makeReq("GET", "/api/status"), res);
      expect(res.writeHead).toHaveBeenCalledWith(400, expect.any(Object));
    });
  });

  describe("handle — errors", () => {
    it("returns 500 when the handler throws", async () => {
      EndpointManagerService.getInstance()["endpoints"].set("status", {
        description: "test", auth: "PUBLIC",
        get: jest.fn().mockRejectedValue(new Error("boom")),
      } satisfies IManagedEndpoint);

      const res = makeRes();
      await EndpointManagerService.getInstance().handle(makeReq("GET", "/api/status"), res);
      expect(res.writeHead).toHaveBeenCalledWith(500, expect.any(Object));
    });
  });
});
