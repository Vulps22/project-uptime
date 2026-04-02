import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is not set.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`[Bot] Online as ${client.user?.tag}`);
});

process.on("SIGINT", () => {
  console.log("[Bot] Shutting down.");
  client.destroy();
  process.exit(0);
});

client.login(token);
