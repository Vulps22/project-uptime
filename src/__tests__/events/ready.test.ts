import type { Client } from "discord.js";
import { Events } from "discord.js";
import createReadyEvent from "../../events/ready.js";
import type { EventContext } from "../../types.js";

function makeContext(): EventContext {
  return {
    client: { user: { tag: "Bot#1234" } } as unknown as Client,
    config: {},
    heartbeatService: { ping: jest.fn() },
    scheduler: { start: jest.fn(), stop: jest.fn() },
  };
}

describe("ready event", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("targets the ClientReady event", () => {
    const event = createReadyEvent(makeContext());
    expect(event.event).toBe(Events.ClientReady);
  });

  it("is registered with once=true", () => {
    const event = createReadyEvent(makeContext());
    expect(event.once).toBe(true);
  });

  it("calls scheduler.start() on execute", () => {
    const ctx = makeContext();
    createReadyEvent(ctx).execute();
    expect(ctx.scheduler.start).toHaveBeenCalledTimes(1);
  });

  it("logs the bot tag on execute", () => {
    const ctx = makeContext();
    createReadyEvent(ctx).execute();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Bot#1234"));
  });
});
