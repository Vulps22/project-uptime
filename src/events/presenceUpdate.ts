import { Events, type Presence } from "discord.js";
import type { EventContext, IEvent } from "../types.js";

export default function (ctx: EventContext): IEvent {
  return {
    event: Events.PresenceUpdate,
    execute: async (_old: unknown, newPresence: unknown) => {
      const presence = newPresence as Presence | null;
      if (!presence?.userId) return;

      const url = ctx.config[presence.userId];
      if (!url) return;

      const online = presence.status !== "offline";
      console.log(`[Presence] ${presence.userId} — ${online ? "ONLINE" : "OFFLINE"} (event)`);

      try {
        await ctx.heartbeatService.ping(url, online);
      } catch (err) {
        console.error(`[Presence] ${presence.userId} — heartbeat error:`, err);
      }
    },
  };
}
