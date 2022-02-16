import route from './Route';

const paramsLength = (fn) => {
  const argumentsRegExp = /\(([\s\S]*?)\)/;
  const replaceRegExp = /[ ,\n\r\t]+/;
  // console.log(fn)
  const fnArguments = argumentsRegExp.exec(fn)[1].trim();
  return fnArguments.split(replaceRegExp).length;
};

const getProtohost = (url) => {
  if (typeof url !== 'string' || url.length === 0 || url[0] === '/') return;
  const searchIndex = url.indexOf('?')
  const pathLength = searchIndex !== -1
    ? searchIndex
    : url.length
  const fqdnIndex = url.substr(0, pathLength).indexOf('://')
  return fqdnIndex !== -1 && url.substr(0, url.indexOf('/', 3 + fqdnIndex))
}

const flatten = (s) => {
  let u = 0;
  const fn = el => {
      if(Array.isArray(el)) {
        el.forEach(fn)
        u++;
      }
  };
  s.forEach(fn)
  return s.flat(u);
}

export default class Router {
  constructor() {
    this.stack = [];
  }
  get = (path, ...cbs) => {
    const [newPathRegexp] = route(path);
    this.stack.push({
      regexp: newPathRegexp,
      handle: flatten(cbs),
      type: 'route'
    })
  }
  use = (...args) => {
    if(args.length === 1) {
      const [middleware] = args;
      return this.stack.push({
        type: 'middleware',
        handle: middleware,
      });
    }
    const [pth, middleware] = args;
    const [newPathRegexp] = route(pth);
    return this.stack.push({
      type: 'middleware',
      handle: middleware,
      regexp: newPathRegexp,
      path: pth,
    });
  }
  handle = (req, res, out) => {
    const { url } = req;
    let done = out;
    let idx = 0;
    const next = (err) => {
      if (err) {
        const layer = this.stack[idx];
        if(layer) {
          const stackMap = this.stack.map((el,index) => Object.assign(el, { index }));
          const maxIndex = Math.max(
            ...stackMap
              .filter(({ handle, type }) => {
                if(type === 'middleware') {
                  return paramsLength(handle) <= 3;
                }
                return true;
              })
              .map(({ index }) => index)
          );
          if(layer.type === 'middleware') {
            if(maxIndex + 1 <= idx) {
              done = layer.handle;
              idx++;
            }else {
              idx++; 
              return next(err)
            }
          } else {
            idx++; 
            return next(err)
          }
        }
        return setImmediate(done, err, req, res, next);
      }
      if (idx >= this.stack.length) {
        done = out;
        return setImmediate(done);
      }
      const layer = this.stack[idx++];
      req.originalUrl = req.url;
      setImmediate(() => {
        try {
          if(layer.type === 'route') {
            const isMatch = layer.regexp.test(url);
            if(isMatch) {
                let i = 0;
                const onext = (err) => {
                  if (err) {
                    return setImmediate(next, err);
                  }
                  if (i >= layer.handle.length) {
                    return setImmediate(out);
                  }
                  const olayer = layer.handle[i++];
                  setImmediate(() => {
                    try {
                      olayer(req, res, onext);
                    } catch(error) {
                      next(error);
                    }
                  });
                }
                return onext()
              }
              return next();
          }
          if(paramsLength(layer.handle) >= 4) return next();
          if(layer.regexp) {
            const protohost = getProtohost(req.url) || '';
            const isMatch = layer.regexp.test(url);
            if(isMatch) {
              const c = req.url[layer.path.length]
              if (c && c !== '/' && c !== '.') return next(err)
              req.url = protohost + req.url.substr(protohost.length + layer.path.length);
              if (!protohost && req.url[0] !== '/') {
                req.url = '/' + req.url;
              }
              layer.handle(req, res, next);
              return;
            }
            return next();
          }
          layer.handle(req, res, next);
        }  catch(error) {
          next(error);
        }
      });
    };

    next();
  }
}