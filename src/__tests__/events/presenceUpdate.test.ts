import type { Client } from "discord.js";
import { Events } from "discord.js";
import createPresenceUpdateEvent from "../../events/presenceUpdate.js";
import type { EventContext } from "../../types.js";

const MONITORED_USER = "123456789";
const HEARTBEAT_URL = "https://example.com/heartbeat";

function makeContext(): EventContext {
  return {
    client: {} as unknown as Client,
    config: { [MONITORED_USER]: HEARTBEAT_URL },
    heartbeatService: { ping: jest.fn().mockResolvedValue(undefined) },
    scheduler: { start: jest.fn(), stop: jest.fn() },
  };
}

describe("presenceUpdate event", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("targets the PresenceUpdate event", () => {
    const event = createPresenceUpdateEvent(makeContext());
    expect(event.event).toBe(Events.PresenceUpdate);
  });

  it("is not a once event", () => {
    const event = createPresenceUpdateEvent(makeContext());
    expect(event.once).toBeFalsy();
  });

  it("pings heartbeat as online when status is online", async () => {
    const ctx = makeContext();
    await createPresenceUpdateEvent(ctx).execute(null, { userId: MONITORED_USER, status: "online" });
    expect(ctx.heartbeatService.ping).toHaveBeenCalledWith(HEARTBEAT_URL, true);
  });

  it("pings heartbeat as online when status is idle", async () => {
    const ctx = makeContext();
    await createPresenceUpdateEvent(ctx).execute(null, { userId: MONITORED_USER, status: "idle" });
    expect(ctx.heartbeatService.ping).toHaveBeenCalledWith(HEARTBEAT_URL, true);
  });

  it("pings heartbeat as online when status is dnd", async () => {
    const ctx = makeContext();
    await createPresenceUpdateEvent(ctx).execute(null, { userId: MONITORED_USER, status: "dnd" });
    expect(ctx.heartbeatService.ping).toHaveBeenCalledWith(HEARTBEAT_URL, true);
  });

  it("pings heartbeat as offline when status is offline", async () => {
    const ctx = makeContext();
    await createPresenceUpdateEvent(ctx).execute(null, { userId: MONITORED_USER, status: "offline" });
    expect(ctx.heartbeatService.ping).toHaveBeenCalledWith(HEARTBEAT_URL, false);
  });

  it("does nothing for a non-monitored user", async () => {
    const ctx = makeContext();
    await createPresenceUpdateEvent(ctx).execute(null, { userId: "unknown_user", status: "online" });
    expect(ctx.heartbeatService.ping).not.toHaveBeenCalled();
  });

  it("does nothing when newPresence is null", async () => {
    const ctx = makeContext();
    await createPresenceUpdateEvent(ctx).execute(null, null);
    expect(ctx.heartbeatService.ping).not.toHaveBeenCalled();
  });

  it("does nothing when userId is missing", async () => {
    const ctx = makeContext();
    await createPresenceUpdateEvent(ctx).execute(null, { status: "online" });
    expect(ctx.heartbeatService.ping).not.toHaveBeenCalled();
  });

  it("does not throw when heartbeat ping rejects", async () => {
    const ctx = makeContext();
    (ctx.heartbeatService.ping as jest.Mock).mockRejectedValue(new Error("Network error"));
    const event = createPresenceUpdateEvent(ctx);
    await expect(
      event.execute(null, { userId: MONITORED_USER, status: "online" }),
    ).resolves.toBeUndefined();
  });

  it("logs an error when heartbeat ping rejects", async () => {
    const ctx = makeContext();
    (ctx.heartbeatService.ping as jest.Mock).mockRejectedValue(new Error("timeout"));
    await createPresenceUpdateEvent(ctx).execute(null, { userId: MONITORED_USER, status: "online" });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(MONITORED_USER),
      expect.any(Error),
    );
  });
});
