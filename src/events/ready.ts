import { Events } from "discord.js";
import type { EventContext, IEvent } from "../types.js";

export default function (ctx: EventContext): IEvent {
  return {
    event: Events.ClientReady,
    once: true,
    execute: () => {
      console.log(`[Bot] Logged in as ${ctx.client.user?.tag}`);
      ctx.scheduler.start();
    },
  };
}
