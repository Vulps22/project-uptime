import { Client } from "discord.js";
import type { IPresenceChecker } from "./types.js";

/**
 * Checks Discord user presence across all guilds the bot is in.
 * "Online" is defined as any status that is not "offline" —
 * i.e. online, idle, or dnd are all considered healthy.
 */
export class PresenceChecker implements IPresenceChecker {
  constructor(private readonly client: Client) {}

  isOnline(snowflakeId: string): boolean {
    for (const guild of this.client.guilds.cache.values()) {
      const presence = guild.presences.cache.get(snowflakeId);
      if (presence && presence.status !== "offline") {
        return true;
      }
    }
    return false;
  }
}
