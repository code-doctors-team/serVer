import http from 'http';
import View from './view';
import Router from '../router';
import finalhandler from 'finalhandler';
import createResponse from './response';
import middlewareInit from './middleware/init';
// import createRequest from './request';

const tryRender = (view, options, callback) => {
  try {
    view.render(options, callback);
  } catch (err) {
    callback(err);
  }
}

class App {
  constructor(ServerSocket = null) {
    this.ServerSocket = ServerSocket;
    this.options = {};
    this.cache = {};
    this.engines = {};
    this.defaultConfiguration()
  }
  logerror = err => this.get('env') !== 'test' && console.error(err.stack || err.toString());
  defaultConfiguration = () => {
    const env = process.env.NODE_ENV || 'development';
    this.locals = Object.create(null);
    this.set('env', env);
    this.set('view', View);
    this.use(middlewareInit(this));
    this.#newServer = http.createServer({
      ServerResponse: createResponse(this),
      // IncomingMessage: createRequest(this),
    }, this.#fn);
    if(this.ServerSocket) {
      Reflect.set(this,'socket', new this.ServerSocket({ server: this.#newServer }))
    }
  }
  engine = (ext, fn) => {
    if (typeof fn !== 'function') {
      throw new Error('callback function required');
    }
    const extension = `${ext[0] !== '.' ? '.' : ''}`.concat(ext).trim();
    // store engine
    Reflect.set(this.engines, extension, fn)

    return this;
  };
  use = (...args) => {
    this.lazyrouter();
    this.#router.use(...args);
  }
  #fn = (req, res, next) => this.handle(req, res, next);
  handle = (req, res, cb) => {
    const router = this.#router;
    const done = cb || finalhandler(req, res, {
       env: this.set('env'),
       onerror: this.logerror,
    })
    if(!router) {
      done();
      return;
    }
    router.handle(req, res, done)
  }
  get = (path, ...cbs) => {
    if (!cbs.length) {
      // app.get(setting)
      return this.set(path);
    }

    this.lazyrouter();

    this.#router.get(path, ...cbs);
    return this;
  };
  #newServer = null;
  /**
   * @param {string} key
   * @param {any} [value]
   */
  set = (key, value) => {
    if(key && !value) {
      if(Reflect.has(this.options, key)) {
        return Reflect.get(this.options, key);
      }
      return null;
    } 
    return Reflect.set(this.options, key, value);
  }
  listen = (...args) => {
    this.#newServer.listen(...args)
  };
  #router = null;
  lazyrouter = () => {
    if (!this.#router) {
      this.#router = new Router();
    }
  };
  enabled = (setting) => Boolean(this.set(setting));
  disabled = (setting) => !this.set(setting);
  enable = (setting) => this.set(setting, true);
  disable = (setting) => this.set(setting, false);
  render = (name, opts, done) => {
    const { engines, cache } = this;
    let view;
    let renderOptions = {};
    renderOptions = Object.assign(renderOptions, this.locals)
    if (opts._locals) {
      renderOptions = Object.assign(renderOptions, opts._locals)
    }
    renderOptions = Object.assign(renderOptions, opts)
    if (renderOptions.cache === null) {
      Reflect.set(renderOptions, 'cache', this.enabled('view cache'))
    }
    if (renderOptions.cache) {
      view = cache[name];
    }  
    if (!view) {
      const ViewGetted = this.get('view');
  
      view = new ViewGetted(name, {
        defaultEngine: this.get('view engine'),
        root: this.get('view root'),
        engines: engines
      });

      if (!view.path) {
        const dirs = Array.isArray(view.root) && view.root.length > 1 ? `directories "${view.root.slice(0, -1)}", or "${view.root[view.root.length - 1]}"`: `directory "${view.root}"`;
        const err = new Error(`Falied to lookup view "${name}" in views ${dirs}`);
        err.view = view;
        return done(err);
      }
  
      // prime the cache
      if (renderOptions.cache) {
        cache[name] = view;
      }
    }
    tryRender(view, renderOptions, done);
  };
}

export default function createApplication(ServerSocket) {
  const app = new App(ServerSocket);
  return app;
}