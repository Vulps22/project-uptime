import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { HeartbeatService } from "./heartbeat.js";
import { MonitorScheduler } from "./monitor.js";
import { PresenceChecker } from "./presence.js";
import { EventRegisterService } from "./EventRegisterService.js";
import { startApi } from "./api.js";
import config from "./config.json";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is not set in environment.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
  ],
});

const heartbeatService = new HeartbeatService();
const presenceChecker = new PresenceChecker(client);
const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);

EventRegisterService.getInstance({ client, config, heartbeatService, scheduler }).register();
startApi(presenceChecker);

process.on("SIGINT", () => {
  scheduler.stop();
  client.destroy();
  process.exit(0);
});

client.login(token);
