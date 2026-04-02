import type { Awaitable, Client, Events } from "discord.js";

/** Maps a Discord user snowflake ID to an InStatus heartbeat URL. */
export type MonitorConfig = Record<string, string>;

/** Checks whether a Discord user is currently online (any non-offline status). */
export interface IPresenceChecker {
  isOnline(snowflakeId: string): boolean;
}

/** Sends a heartbeat ping to a URL. */
export interface IHeartbeatService {
  ping(url: string, online: boolean): Promise<void>;
}

/** Runs the monitor loop. */
export interface IMonitorScheduler {
  start(): void;
  stop(): void;
}

export type AuthType = 'PUBLIC' | 'RESTRICTED';

export interface EndpointParameter {
  name: string;
  type: string;
  requiredBy: string[]; // HTTP methods that require this parameter e.g. ['GET', 'POST']
}

export interface EndpointRequest {
  endpointParams: Record<string, string>;
  urlParams: Record<string, string>;
}

export interface IManagedEndpoint {
  description: string;
  auth: AuthType;
  endpointParameters?: EndpointParameter[];
  urlParameters?: EndpointParameter[];

  get?(req: EndpointRequest): unknown;
  post?(req: EndpointRequest): unknown;
  put?(req: EndpointRequest): unknown;
  delete?(req: EndpointRequest): unknown;
}

/** A Discord event handler object. */
export interface IEvent {
  event: Events;
  once?: boolean;
  execute: (...args: unknown[]) => Awaitable<void>;
}

/** Dependencies available to event factories. */
export interface EventContext {
  client: Client;
  config: MonitorConfig;
  heartbeatService: IHeartbeatService;
  scheduler: IMonitorScheduler;
}
