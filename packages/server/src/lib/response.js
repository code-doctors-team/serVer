import { ServerResponse } from 'http';
import * as contentType from './content-type';
import { mime } from 'send';

const setCharset = (type, charset) => {
  if (!type || !charset) {
    return type;
  }

  // parse type
  const parsed = contentType.parse(type);

  // set charset
  parsed.parameters.charset = charset;

  // format type
  return contentType.format(parsed);
};
const stringify = (value, replacer, spaces, escape) => {
  // v8 checks arguments.length for optimizing simple call
  // https://bugs.chromium.org/p/v8/issues/detail?id=4730
  var json = replacer || spaces
    ? JSON.stringify(value, replacer, spaces)
    : JSON.stringify(value);

  if (escape) {
    json = json.replace(/[<>&]/g, function (c) {
      switch (c.charCodeAt(0)) {
        case 0x3c:
          return '\\u003c'
        case 0x3e:
          return '\\u003e'
        case 0x26:
          return '\\u0026'
        /* istanbul ignore next: unreachable default */
        default:
          return c
      }
    })
  }

  return json
}
const charsetRegExp = /;\s*charset\s*=/;

export default function createResponse(app) {
  return class Response extends ServerResponse {
    constructor(req) {
      super(req);
      this.req = req;
      this.app = app;
    }
    set = (...args) => {
      const [field, val] = args;
      if (args.length === 2) {
        let value = Array.isArray(val)
          ? val.map(String)
          : String(val);
    
        // add charset to content-type
        if (field.toLowerCase() === 'content-type') {
          if (Array.isArray(value)) {
            throw new TypeError('Content-Type cannot be set to an Array');
          }
          if (!charsetRegExp.test(value)) {
            const charset = mime.charsets.lookup(value.split(';')[0]);
            if (charset) value += `; charset=${charset.toLowerCase()}`;
          }
        }
    
        this.setHeader(field, value);
      } else {
        Object.keys(field).forEach((key) => this.set(key, field[key]))
      }
      return this;
    };
    header =(...args) => {
      const [field, val] = args;
      if (args.length === 2) {
        let value = Array.isArray(val)
          ? val.map(String)
          : String(val);
    
        // add charset to content-type
        if (field.toLowerCase() === 'content-type') {
          if (Array.isArray(value)) {
            throw new TypeError('Content-Type cannot be set to an Array');
          }
          if (!charsetRegExp.test(value)) {
            const charset = mime.charsets.lookup(value.split(';')[0]);
            if (charset) value += '; charset=' + charset.toLowerCase();
          }
        }
    
        this.setHeader(field, value);
      } else {
        Object.keys(field).forEach((key) => this.set(key, field[key]))
      }
      return this;
    };
    type = (type) => {
      const ct = type.indexOf('/') === -1
                  ? mime.lookup(type)
                  : type;
  
      return this.set('Content-Type', ct);
    };
    contentType = (type) => {
      const ct = type.indexOf('/') === -1
                  ? mime.lookup(type)
                  : type;
  
      return this.set('Content-Type', ct);
    };
    status = (code) => {
      Reflect.set(this, 'statusCode', code);
      return this;
    };
    render = (view, opts = {}, cb) => {
      const req = this.req;
      let dn = cb;
      if(typeof opts === 'function') {
        dn = opts;
      }
      const done = dn || ((err, str) => {
        if (err) return req.next(err);
        this.send(str);
      });
      app.render(view, opts, done);
    }
    send = (body) => {
      let encoding;
      let type;
      let chunk = body;
      switch (typeof chunk) {
        // string defaulting to html
        case 'string':
          if (!this.get('Content-Type')) {
            this.type('html');
          }
          break;
        case 'boolean':
        case 'number':
        case 'object':
          if (chunk === null) {
            chunk = '';
          } else if (Buffer.isBuffer(chunk)) {
            if (!this.get('Content-Type')) {
              this.type('bin');
            }
          } else {
            return this.json(chunk);
          }
          break;
      }
       if (typeof chunk === 'string') {
        encoding = 'utf8';
        type = this.get('Content-Type');
  
      // reflect this in content-type
      if (typeof type === 'string') {
        this.set('Content-Type', setCharset(type, 'utf-8'));
      }
    }
      this.end(chunk, encoding)
    }
    json = (...args) => {
      let [val] = args;

      // allow status / body
      if (args.length === 2) {
        // res.json(body, status) backwards compat
        if (typeof args[1] === 'number') {
          this.statusCode = args[1];
        } else {
          this.statusCode = args[0];
          val = args[1];
        }
      }
    
      // settings
      const app = this.app;
      const escape = app.get('json escape')
      const replacer = app.get('json replacer');
      const spaces = app.get('json spaces');
      const body = stringify(val, replacer, spaces, escape)
    
      // content-type
      if (!this.get('Content-Type')) {
        this.set('Content-Type', 'application/json');
      }
    
      return this.send(body);
    }
    get = (field) => this.getHeader(field);
  };
}