import "dotenv/config";
import fs from "fs";
import { Client, GatewayIntentBits } from "discord.js";
import { HeartbeatService } from "./heartbeat.js";
import { MonitorScheduler } from "./monitor.js";
import { PresenceChecker } from "./presence.js";
import { EventRegisterService } from "./EventRegisterService.js";
import { EndpointManagerService } from "./EndpointManagerService.js";
import type { MonitorConfig } from "./types.js";

const configPath = process.env.CONFIG_PATH ?? "/app/config.json";
let config: MonitorConfig = {};
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as MonitorConfig;
  console.log(`[Config] Loaded ${Object.keys(config).length} monitor(s) from ${configPath}`);
} catch {
  console.warn(`[Config] Could not read config at ${configPath} — starting with no monitors.`);
}

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
const presenceChecker = PresenceChecker.getInstance(client);
const scheduler = new MonitorScheduler(config, presenceChecker, heartbeatService);

EventRegisterService.getInstance({ client, config, heartbeatService, scheduler }).register();
EndpointManagerService.getInstance().register().listen(3005);

process.on("SIGINT", () => {
  scheduler.stop();
  client.destroy();
  process.exit(0);
});

client.login(token);
