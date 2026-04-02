import fs from "fs";
import path from "path";
import type { EventContext, IEvent } from "./types.js";

type EventFactory = (ctx: EventContext) => IEvent;

export class EventRegisterService {
  private static instance: EventRegisterService;

  private constructor(private readonly ctx: EventContext) {}

  static getInstance(ctx: EventContext): EventRegisterService {
    if (!EventRegisterService.instance) {
      EventRegisterService.instance = new EventRegisterService(ctx);
    }
    return EventRegisterService.instance;
  }

  register(): void {
    const eventsDir = path.join(__dirname, "events");
    const files = fs
      .readdirSync(eventsDir)
      .filter((f) => (f.endsWith(".ts") || f.endsWith(".js")) && !f.endsWith(".d.ts"));

    for (const file of files) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(path.join(eventsDir, file)) as { default?: EventFactory };
      const factory = mod.default;

      if (typeof factory !== "function") {
        console.warn(`[EventRegister] Skipping ${file}: no default export function.`);
        continue;
      }

      const event = factory(this.ctx);
      const method = event.once ? "once" : "on";

      (this.ctx.client as unknown as { on: (...a: unknown[]) => void; once: (...a: unknown[]) => void })[method](
        event.event,
        (...args: unknown[]) => event.execute(...args),
      );

      console.log(`[EventRegister] Registered ${event.once ? "once" : "on"}:${event.event} (${file})`);
    }
  }
}
