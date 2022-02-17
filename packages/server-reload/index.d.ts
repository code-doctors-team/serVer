import Spinner from "@sv-cd/cli-loader";
import { watch } from "chokidar";
import EventEmitter from "events";

declare class ServerReload {
  constructor(emitter: EventEmitter)

  emitter: EventEmitter;
  watch: typeof watch;

  private initPlugins(plugins: any[], secondParams: { version: string, sv: any }): void;
  private emitPlugin(plugin: any, data: any): void;
  
  init(params: { server: any, port: number, version: string, plugins: any[],spinner: Spinner }, cb: (param: {
    url: string,
    urlExternal: string,
    snippet: string,
  }) => Promise<void> | void): this & any;
  'emit:plugin'(namePlugin: string, event: string, data: any): void;
  messageHandle(messageData: Object): void;
  reload(pth?: string | null, type?: string, aditionalData?: Object): void;
  emit(type: string, ...data: any[]): void;
  on(type: string, fn: Function): void;
  logger(this: ServerReload, ...args: string[]): void;
}

export function create(name: string, emitter?: EventEmitter): ServerReload;

export function get(name: string): ServerReload | null;
 