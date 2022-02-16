import { dirname, basename, extname, join, resolve } from 'path';
import fs from 'fs';

function tryStat(path) {
  try {
    return fs.statSync(path);
  } catch (e) {
    return undefined;
  }
}
// async function
export default class View {
  constructor(name, options) {
    const opts = options || {};
    this.defaultEngine = opts.defaultEngine;
    this.ext = extname(name);
    this.name = name;
    this.root = opts.root;

    if (!this.ext && !this.defaultEngine) {
      throw new Error('No default engine was specified and no extension was provided.');
    }

    let fileName = name;

    if (!this.ext) {
    // get extension from default engine name
      this.ext = this.defaultEngine[0] !== '.'
        ? '.' + this.defaultEngine
        : this.defaultEngine;

      fileName += this.ext;
    }

    if (!opts.engines[this.ext]) {
    // load engine
      const mod = this.ext.substr(1)

    // default engine export
      const fn = require(mod).__express

      if (typeof fn !== 'function') {
        throw new Error('Module "' + mod + '" does not provide a view engine.')
      }

      Reflect.set(opts.engines, this.ext, fn);
    }

  // store loaded engine
    this.engine = opts.engines[this.ext];

  // lookup path
    this.path = this.lookup(fileName);
  }
  lookup = (name) => {
    let pth;
    const roots = [this.root];
    for (let i = 0; i < roots.length && !pth; i++) {
      const root = roots[i];
  
      // resolve the pth
      const loc = resolve(root, name);
      const dir = dirname(loc);
      const file = basename(loc);
  
      // resolve the file
      pth = this.resolve(dir, file);
    }
  
    return pth;
  };
  render = (options, callback) => {
    this.engine(this.path, options, callback);
  };
  resolve = (dir, file) => {
    const ext = this.ext;
  
    // <path>.<ext>
    let path = join(dir, file);
    let stat = tryStat(path);
  
    if (stat && stat.isFile()) {
      return path;
    }
  
    // <path>/index.<ext>
    path = join(dir, basename(file, ext), 'index' + ext);
    stat = tryStat(path);
  
    if (stat && stat.isFile()) {
      return path;
    }
  };
}