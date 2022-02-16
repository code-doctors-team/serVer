import EventEmitter from 'events';
import parse, { HTMLElement } from 'node-html-parser';

interface pluginInterface extends EventEmitter {
  readonly name: string,
  readonly inject: string,
  parse: typeof parse
}
// const plugin: pluginInterface;
declare const plugin: pluginInterface;

export default plugin;

export {
  HTMLElement
};