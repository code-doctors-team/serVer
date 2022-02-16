import EventEmitter from 'events';
import { resolve } from 'path'; 
import { readFileSync } from 'fs'; 
import config from './config';
import { initHTML } from './utils';
import parse from 'node-html-parser';
const eventEmitter = new EventEmitter();

const plugin = Object.assign(eventEmitter, config, {
  inject: readFileSync(resolve(__dirname, './clients.js'), 'utf-8'),
  parse,
});

eventEmitter.on(config.name, ({ on, type, req, ...data }) => {
  if(!req) return;
  const url = [req.headers.host || req.headers.origin, req.url].join('');
  initHTML(url, type, data)
})

export default plugin 