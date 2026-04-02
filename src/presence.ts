import { Client } from "discord.js";
import type { IPresenceChecker } from "./types.js";

export class PresenceChecker implements IPresenceChecker {
  private static instance: PresenceChecker;

  constructor(private readonly client: Client) {}

  static getInstance(client?: Client): PresenceChecker {
    if (!PresenceChecker.instance) {
      if (!client) throw new Error("PresenceChecker has not been initialised.");
      PresenceChecker.instance = new PresenceChecker(client);
    }
    return PresenceChecker.instance;
  }

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
