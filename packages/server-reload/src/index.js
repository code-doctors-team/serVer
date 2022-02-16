import EventEmitter from 'events';
import ServerReload from './lib/ServerReload';

const instances = new Map();

const newEmitter = () => new EventEmitter();

export const create = (name = new Date().getTime(), emitter = newEmitter()) => {
  const instance = new ServerReload(emitter);
  Reflect.set(instance, 'name', name);
  instances.set(name ,instance);
  return instance; 
} 

export const get = (name) => instances.get(name) || null;