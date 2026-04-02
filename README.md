# project-uptime

Monitors Discord user presence and sends heartbeat pings to [InStatus](https://instatus.com) uptime monitors every 5 minutes.

## How it works

1. The bot logs into Discord with the `Guilds` and `GuildPresences` privileged intents.
2. Every 5 minutes it reads `src/config.json`, which maps Discord user snowflake IDs to InStatus heartbeat URLs.
3. For each entry it checks the user's presence across all guilds the bot shares with them.
4. **If the user is online** (status is `online`, `idle`, or `dnd`) → a `GET` request is sent to the heartbeat URL, telling InStatus the monitor is healthy.
5. **If the user is offline** → no request is sent. InStatus will mark the monitor as down after its configured missed-heartbeat threshold.

## Project structure

```
src/
  config.json      # { "<snowflake>": "<heartbeat-url>", ... }
  types.ts         # Interfaces (IPresenceChecker, IHeartbeatService, IMonitorScheduler)
  heartbeat.ts     # HeartbeatService  — sends GET pings via Node native fetch
  presence.ts      # PresenceChecker   — checks Discord presence via discord.js
  monitor.ts       # MonitorScheduler  — drives the 5-minute loop
  index.ts         # Entry point       — wires everything together
```

### SOLID breakdown

| Principle | Applied |
|-----------|---------|
| **S**ingle Responsibility | Each class does exactly one thing (check presence, send ping, schedule loop) |
| **O**pen/Closed | New notifiers or checkers can be added by implementing the interfaces, no existing code changes needed |
| **L**iskov Substitution | `MonitorScheduler` depends on `IPresenceChecker` / `IHeartbeatService` — any conforming implementation drops in |
| **I**nterface Segregation | Three small, focused interfaces rather than one fat one |
| **D**ependency Inversion | `MonitorScheduler` never imports concrete classes; they're injected from `index.ts` |

## Setup

### 1. Create a Discord bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. Under **Bot**, enable the **Presence Intent** (privileged gateway intent).
3. Copy the bot token.
4. Invite the bot to your server with at minimum the `bot` scope (no extra permissions required).

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set BOT_TOKEN=your_token_here
```

### 3. Configure monitors

Edit `src/config.json`:

```json
{
  "123456789012345678": "https://uptime.instatus.com/api/v2/cl.../heartbeats/...",
  "987654321098765432": "https://uptime.instatus.com/api/v2/cl.../heartbeats/..."
}
```

- **Key** — the Discord user's snowflake ID (right-click user → Copy User ID with Developer Mode on).
- **Value** — the heartbeat URL from your InStatus component's heartbeat settings.

### 4. Install & run

```bash
npm install
npm run dev        # development (ts-node)
npm run build && npm start  # production
```

## Notes

- **No axios** — HTTP requests use Node's built-in `fetch` (requires Node ≥ 18). This avoids the axios npm supply chain compromise (versions `1.14.1` and `0.30.4` were found to contain a RAT dropper in March 2026; safe versions are `≤1.14.0`).
- The bot does not need to read messages or have any permissions — it only observes presence.
- Presence is only visible for users who share a guild with the bot.
