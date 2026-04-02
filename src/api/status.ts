import type { EndpointRequest, IManagedEndpoint } from "../types.js";
import { PresenceChecker } from "../presence.js";

export default class StatusEndpoint implements IManagedEndpoint {
  readonly description = "Returns the presence status of a Discord user";
  readonly auth = "PUBLIC" as const;
  readonly endpointParameters = [
    { name: "snowflake", type: "string", requiredBy: ["GET"] },
  ];

  get({ endpointParams }: EndpointRequest) {
    const { snowflake } = endpointParams;
    return { snowflake, online: PresenceChecker.getInstance().isOnline(snowflake) };
  }
}
