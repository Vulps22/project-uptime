import type { IHeartbeatService, IMonitorScheduler, IPresenceChecker, MonitorConfig } from "./types.js";

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export class MonitorScheduler implements IMonitorScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly config: MonitorConfig,
    private readonly presenceChecker: IPresenceChecker,
    private readonly heartbeatService: IHeartbeatService,
  ) {}

  start(): void {
          if (Object.keys(this.config).length === 0) {
        console.log("[Monitor] No monitored users — Disabling monitor scheduler.");
        return;
      }

    if (this.intervalId !== null) return;
    console.log("[Monitor] Starting — checking every 5 minutes.");
    this.intervalId = setInterval(() => this.tick(), INTERVAL_MS);
    // Run immediately on start as well
    this.tick();
  }

  stop(): void {
    if (this.intervalId === null) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    console.log("[Monitor] Stopped.");
  }

  private async tick(): Promise<void> {
    const entries = Object.entries(this.config);
    await Promise.allSettled(
      entries.map(([snowflakeId, url]) => this.checkAndPing(snowflakeId, url)),
    );
  }

  private async checkAndPing(snowflakeId: string, url: string): Promise<void> {
    const online = this.presenceChecker.isOnline(snowflakeId);
    console.log(`[Monitor] ${snowflakeId} — ${online ? "ONLINE" : "OFFLINE"}`);

    try {
      await this.heartbeatService.ping(url, online);
      console.log(`[Monitor] ${snowflakeId} — ${online ? "heartbeat sent." : "failure reported."}`);
    } catch (err) {
      console.error(`[Monitor] ${snowflakeId} — heartbeat error:`, err);
    }
  }
}
