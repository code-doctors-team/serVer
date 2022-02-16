import { isAbsolute, resolve } from 'path';
import { NextFunction, Response } from 'express';
import config from '../config';
import Router from '../router';
import Data from '../data';
import { snippetSv } from '../libs/dev';
import middlewareCss from './css.mid';
import middlewareAssets from './assets.mid';
import middlewareJs from './js.mid';
import addRoute from './addRoutes.mid';
import errorEjsMiddleware from './errorEjs.mid';
import error404 from './error404.mid';

const addScript = (html: string): string => {
  let newHtml: string = html;
  if(html.includes('</head>')) {
    newHtml = html.replace('</head>', snippetSv.concat('</head>'));
  } else if(html.includes('</body>')) {
    newHtml = html.replace('</body>', snippetSv.concat('</body>'));
  } else if(html) {
    newHtml = html.concat(snippetSv);
  }
  return newHtml;
}

const addData = (sv: any): any => {
  const dataInstance = new Data(sv);
  config.data = dataInstance;
  let { data } = dataInstance;
  dataInstance.loadData(newData => {
    data = newData
  })
  return data;
};

const addRoutes = (sv: any) => {
  const router = new Router(config);
  config.router = router;
  router.loadRoutes(() => {
    const data = addData(sv);
    router.routes.forEach(route => {
      sv.get(route.url, (req: Request, res: Response, next: NextFunction) => {
        if(!router.has(route.url, false)) return next();
        const dataUrl = data.get(route.url);
        const parent = route.root !== route.url && route.root !== '/' && !dataUrl && data.get(route.root) || {};
        res.render(route.relativePath ?? route.absolutePath, Object.assign(dataUrl || {}, parent));
      })
    })
    sv.use(addRoute);
    sv.use(error404);
    sv.use(errorEjsMiddleware);
  });
};

export default function addMiddlewaresAndRoutes(sv: any, { version }:{ version: string }) {
  sv.use(middlewareCss);
  sv.use(middlewareJs);
  sv.use(middlewareAssets);
  sv.use((req: Request, res: Response & { __render: (...args: any[]) => void }, next: NextFunction) => {
    res.__render = res.render;
    res.render = (...args: [string, object]) => {
      const [pth] = args;
      if(isAbsolute(pth)) {
        return res.__render(...args)
      };
      res.__render(...args, async (err: Error, htmlParam: string) => {
          if(err) return next(err);
          let html = htmlParam;
          if(!html.length) {
            const EmptyTemplatePath: string = resolve(__dirname, '../templates/_empty_template.ejs');
            const { render } = await import('ejs');
            const { Transform } = await import('stream');
            const { createReadStream } = await import('fs');  
            const templateStream = createReadStream(EmptyTemplatePath, 'utf-8');
            const TransformTemplateContent = new Transform({
              write(chunk, encoding, cb) {
                const EmptyTemplateContent = render(chunk.toString(), {
                  url: req.url, 
                  version,
                });
                this.push(addScript(EmptyTemplateContent));
                cb()
              }
            })
            templateStream.pipe(TransformTemplateContent).pipe(res);
          }else {
            const newHtml: string = addScript(html);
            res.end(newHtml)
          }
      })
    }
    next();
  });
  sv.set('view root', config.pagesRoot);
  sv.set('view engine', 'ejs')
  addRoutes(sv);
}