export default function middlewareInit(app) {
  return (req, res, next) => {
    if (app.enabled('x-powered-by')) res.setHeader('X-Powered-By', 'serVer');
    Reflect.set(req, 'next', next)
    Reflect.set(res, 'locals', res.locals || app.locals || Object.create(null))
    next();
  }
} 