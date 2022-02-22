import { NextFunction, Response, Request } from 'express';
import config from '../config';

export default function error404(req: Request, res: Response, _next: NextFunction) {
  const [page404, dataExtra404] = [config.router.get('/404'), config.data.get('/404')];
  const data404 = {
    ...(dataExtra404 || {}),
    url: req.url,
    mode: 'development'
  };
  const isDefault: boolean = Boolean(!page404.relativePath && page404.absolutePath && true);
  const filename: string = page404.relativePath ?? page404.absolutePath;
  res.status(404).render(filename, Object.assign(data404, isDefault ? {
    cache: isDefault,
    delimiter: isDefault ? 'A': '%',
    filename,
  }: {}));
}