import EventEmitter from 'events';
import { resolve } from 'path'; 
import { readFileSync } from 'fs'; 
import config, { cache } from './config';
import handle from './utils/handle';

const eventEmitter = new EventEmitter();

const plugin = Object.assign(eventEmitter, config, {
  inject: readFileSync(resolve(__dirname, './clients.js')),
});

eventEmitter.on(config.name, ({ path, emit, cssRoot, type }) => {
  if(type === 'change') {
    handle(path, cssRoot, emit)
  }
})

Reflect.set(plugin, 'cache', cache);

export default plugin;