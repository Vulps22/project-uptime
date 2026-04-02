import type { Client } from "discord.js";
import { PresenceChecker } from "../presence.js";

function makeClient(guilds: Record<string, Record<string, string>>): Client {
  return {
    guilds: {
      cache: new Map(
        Object.entries(guilds).map(([guildId, presences]) => [
          guildId,
          {
            presences: {
              cache: new Map(
                Object.entries(presences).map(([userId, status]) => [userId, { status }]),
              ),
            },
          },
        ]),
      ),
    },
  } as unknown as Client;
}

describe("PresenceChecker", () => {
  it("returns true when user is online", () => {
    const client = makeClient({ g1: { user1: "online" } });
    expect(new PresenceChecker(client).isOnline("user1")).toBe(true);
  });

  it("returns true when user is idle", () => {
    const client = makeClient({ g1: { user1: "idle" } });
    expect(new PresenceChecker(client).isOnline("user1")).toBe(true);
  });

  it("returns true when user is dnd", () => {
    const client = makeClient({ g1: { user1: "dnd" } });
    expect(new PresenceChecker(client).isOnline("user1")).toBe(true);
  });

  it("returns false when user is offline", () => {
    const client = makeClient({ g1: { user1: "offline" } });
    expect(new PresenceChecker(client).isOnline("user1")).toBe(false);
  });

  it("returns false when user is not in any guild", () => {
    const client = makeClient({ g1: {} });
    expect(new PresenceChecker(client).isOnline("user1")).toBe(false);
  });

  it("returns false when there are no guilds", () => {
    const client = makeClient({});
    expect(new PresenceChecker(client).isOnline("user1")).toBe(false);
  });

  it("returns true if user is online in any guild even if offline in another", () => {
    const client = makeClient({
      g1: { user1: "offline" },
      g2: { user1: "online" },
    });
    expect(new PresenceChecker(client).isOnline("user1")).toBe(true);
  });

  it("returns false if user is offline in all guilds", () => {
    const client = makeClient({
      g1: { user1: "offline" },
      g2: { user1: "offline" },
    });
    expect(new PresenceChecker(client).isOnline("user1")).toBe(false);
  });
});
