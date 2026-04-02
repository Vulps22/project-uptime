import { HeartbeatService } from "../heartbeat.js";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("HeartbeatService", () => {
  let service: HeartbeatService;

  beforeEach(() => {
    service = new HeartbeatService();
    mockFetch.mockReset();
  });

  it("pings the base URL when online", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await service.ping("https://example.com/heartbeat", true);
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/heartbeat");
  });

  it("pings the /fail URL when offline", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await service.ping("https://example.com/heartbeat", false);
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/heartbeat/fail");
  });

  it("throws when the response is not ok", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    await expect(service.ping("https://example.com/heartbeat", true)).rejects.toThrow("HTTP 503");
  });

  it("throws for both online and offline non-ok responses", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });
    await expect(service.ping("https://example.com/heartbeat", false)).rejects.toThrow("HTTP 404");
  });
});
