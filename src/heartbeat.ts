import type { IHeartbeatService } from "./types.js";

export class HeartbeatService implements IHeartbeatService {
  async ping(url: string, online: boolean): Promise<void> {
    const target = online ? url : `${url}/fail`;
    const response = await fetch(target);
    if (!response.ok) {
      throw new Error(`Heartbeat ping failed for ${target} — HTTP ${response.status}`);
    }
  }
}
