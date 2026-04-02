import type { Client } from "discord.js";
import { Events } from "discord.js";
import { EventRegisterService } from "../EventRegisterService.js";
import type { EventContext } from "../types.js";

function makeContext(): EventContext {
  return {
    client: {
      on: jest.fn(),
      once: jest.fn(),
      user: { tag: "TestBot#0000" },
    } as unknown as Client,
    config: {},
    heartbeatService: { ping: jest.fn() },
    scheduler: { start: jest.fn(), stop: jest.fn() },
  };
}

beforeEach(() => {
  // Reset singleton between tests
  (EventRegisterService as unknown as { instance: unknown }).instance = undefined;
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("EventRegisterService", () => {
  it("returns the same instance on repeated calls (singleton)", () => {
    const ctx = makeContext();
    const a = EventRegisterService.getInstance(ctx);
    const b = EventRegisterService.getInstance(ctx);
    expect(a).toBe(b);
  });

  it("registers the ready event with once", () => {
    const ctx = makeContext();
    EventRegisterService.getInstance(ctx).register();
    expect((ctx.client as unknown as { once: jest.Mock }).once).toHaveBeenCalledWith(
      Events.ClientReady,
      expect.any(Function),
    );
  });

  it("registers the presenceUpdate event with on", () => {
    const ctx = makeContext();
    EventRegisterService.getInstance(ctx).register();
    expect((ctx.client as unknown as { on: jest.Mock }).on).toHaveBeenCalledWith(
      Events.PresenceUpdate,
      expect.any(Function),
    );
  });

  it("does not call on for the ready event", () => {
    const ctx = makeContext();
    EventRegisterService.getInstance(ctx).register();
    const onCalls = (ctx.client as unknown as { on: jest.Mock }).on.mock.calls.map(([e]) => e);
    expect(onCalls).not.toContain(Events.ClientReady);
  });
});
