import Spinner from '@sv-cd/cli-loader';
import { ServerReload } from '@sv-cd/server-reload';
import EventEmitter from 'events';
import { existsSync } from 'fs';
import path from 'path';
import packageJson from '../../package.json';
import Data from '../data';
import Router from '../router';

export type typeServer = 'dev' | 'build' | 'start';

export type configType = {
  name: string,
  version: string,
  spinner: Spinner | null,
  sv: null | ServerReload,
  root: string,
  pagesRoot: string,
  cssRoot: string,
  assetsRoot: string,
  dist: string,
  type: typeServer,
  jsRoot: string,
  router: null | Router,
  data: null | Data,
  ready: boolean,
  events: EventEmitter,
  '#pagesRoot': string,
  '#dist': string,
  '#cssRoot': string,
  '#assetsRoot': string,
  '#jsRoot': string,
  '#root': string,
}

const name = () => {
  const pathPackageJson: string = process.cwd().concat('/package.json');
  let instance: null | string = null;
  if(existsSync(pathPackageJson)) instance = require(pathPackageJson).name;
  else instance = packageJson.name;
  return {
    getName: () => {
      if(instance === '@sv/core') return 'serVer';
      return instance;
    },
  }
};

const { getName } = name();

let ready: boolean = false;

const defaultConfig: configType = {
  '#pagesRoot': './pages', 
  '#cssRoot': './src/styles', 
  '#assetsRoot': './src/styles', 
  '#jsRoot': './src/scripts', 
  '#dist': './build',
  '#root': '.',
  type: 'dev',
  events: new EventEmitter(),
  get root() {
    if(this['#root'] === '.') return process.cwd();
    return path.resolve(process.cwd(), this['#root']);
  },
  set root(newRoot) {
    this['#root'] = newRoot;
  },
  get pagesRoot() {
    return path.resolve(this.root, this['#pagesRoot']);
  },
  set pagesRoot(value) {
    if(value) {
      this['#pagesRoot'] = value;
    }
  },
  get dist() {
    return path.resolve(this.root, this['#dist']);
  },
  set dist(value) {
    if(value) {
      this['#dist'] = value;
    }
  },
  get cssRoot() {
    return path.resolve(this.root, this['#cssRoot']);
  },
  set cssRoot(value) {
    if(value) {
      this['#cssRoot'] = value;
    }
  },
  get assetsRoot() {
    return path.resolve(this.root, this['#assetsRoot']);
  },
  set assetsRoot(value) {
    if(value) {
      this['#assetsRoot'] = value;
    }
  },
  get jsRoot() {
    return path.resolve(this.root, this['#jsRoot']);
  },
  set jsRoot(value) {
    if(value) {
      this['#jsRoot'] = value;
    }
  },
  get name() {
    return getName();
  },
  version: packageJson.version,
  spinner: null,
  sv: null,
  router: null,
  data: null,
  set ready(isReady: boolean) {
    this.events.emit('ready', true);
    ready = isReady;
  },
  get ready() {
    return ready;
  }
};

const config: configType = Object.assign(defaultConfig);

export default config;