import { Events, type Presence } from "discord.js";
import type { EventContext, IEvent } from "../types.js";

export default function (ctx: EventContext): IEvent {
  return {
    event: Events.PresenceUpdate,
    execute: async (_old: unknown, newPresence: unknown) => {
      if (Object.keys(ctx.config).length === 0) return;

      console.log("[Presence] Event fired");

      const presence = newPresence as Presence | null;

      if (!presence) {
        console.log("[Presence] newPresence is null — ignoring");
        return;
      }

      if (!presence.userId) {
        console.log("[Presence] No userId on presence — ignoring");
        return;
      }

      console.log(`[Presence] userId=${presence.userId} status=${presence.status}`);

      const url = ctx.config[presence.userId];
      if (!url) {
        console.log(`[Presence] userId=${presence.userId} is not monitored — ignoring`);
        return;
      }

      const online = presence.status !== "offline";
      console.log(`[Presence] ${presence.userId} — ${online ? "ONLINE" : "OFFLINE"} — pinging heartbeat`);

      try {
        await ctx.heartbeatService.ping(url, online);
        console.log(`[Presence] ${presence.userId} — heartbeat ping sent (online=${online})`);
      } catch (err) {
        console.error(`[Presence] ${presence.userId} — heartbeat error:`, err);
      }
    },
  };
}
