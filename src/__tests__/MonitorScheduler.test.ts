import { MonitorScheduler } from "../monitor.js";
import type { IHeartbeatService, IPresenceChecker } from "../types.js";

// Flush enough microtask ticks for async chains: start() -> tick() -> Promise.allSettled -> checkAndPing -> ping
const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

describe("MonitorScheduler", () => {
  let presenceChecker: jest.Mocked<IPresenceChecker>;
  let heartbeatService: jest.Mocked<IHeartbeatService>;
  const config = {
    user1: "https://example.com/h1",
    user2: "https://example.com/h2",
  };

  let capturedIntervalFn: (() => void) | null;
  let capturedIntervalId: NodeJS.Timeout;

  beforeEach(() => {
    presenceChecker = { isOnline: jest.fn().mockReturnValue(true) };
    heartbeatService = { ping: jest.fn().mockResolvedValue(undefined) };
    capturedIntervalFn = null;
    capturedIntervalId = 999 as unknown as NodeJS.Timeout;

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    jest.spyOn(global, "setInterval").mockImplementation((fn) => {
      capturedIntervalFn = fn as () => void;
      return capturedIntervalId;
    });
    jest.spyOn(global, "clearInterval").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("ticks immediately on start", async () => {
    const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);
    scheduler.start();
    await flush();
    expect(presenceChecker.isOnline).toHaveBeenCalledWith("user1");
    expect(presenceChecker.isOnline).toHaveBeenCalledWith("user2");
  });

  it("does not tick twice if start is called twice", async () => {
    const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);
    scheduler.start();
    scheduler.start();
    await flush();
    expect(presenceChecker.isOnline).toHaveBeenCalledTimes(2); // 2 users, 1 tick
  });

  it("registers a 5-minute interval on start", () => {
    const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);
    scheduler.start();
    expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
  });

  it("ticks again when the interval fires", async () => {
    const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);
    scheduler.start();
    await flush();
    const callsAfterFirst = presenceChecker.isOnline.mock.calls.length;

    capturedIntervalFn!();
    await flush();

    expect(presenceChecker.isOnline.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("clears the interval on stop()", () => {
    const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);
    scheduler.start();
    scheduler.stop();
    expect(global.clearInterval).toHaveBeenCalledWith(capturedIntervalId);
  });

  it("does not clear interval if stop() is called before start()", () => {
    const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);
    scheduler.stop();
    expect(global.clearInterval).not.toHaveBeenCalled();
  });

  it("pings heartbeat with online=true when user is online", async () => {
    presenceChecker.isOnline.mockReturnValue(true);
    const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);
    scheduler.start();
    await flush();
    expect(heartbeatService.ping).toHaveBeenCalledWith("https://example.com/h1", true);
    expect(heartbeatService.ping).toHaveBeenCalledWith("https://example.com/h2", true);
  });

  it("pings heartbeat with online=false when user is offline", async () => {
    presenceChecker.isOnline.mockReturnValue(false);
    const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);
    scheduler.start();
    await flush();
    expect(heartbeatService.ping).toHaveBeenCalledWith("https://example.com/h1", false);
    expect(heartbeatService.ping).toHaveBeenCalledWith("https://example.com/h2", false);
  });

  it("continues monitoring other users if one heartbeat throws", async () => {
    heartbeatService.ping
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue(undefined);

    const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);
    scheduler.start();
    await flush();

    expect(heartbeatService.ping).toHaveBeenCalledTimes(2);
  });
});
