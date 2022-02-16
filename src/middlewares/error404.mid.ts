import { NextFunction, Response, Request } from 'express';
import config from '../config';

export default function error404(req: Request, res: Response, next: NextFunction) {
  const page404 = config.router.get('/404');
  const dataExtra404 = config.data.get('/404');
  const data404 = {
    ...(dataExtra404 || {}),
    url: req.url,
    mode: 'development'
  };
  const isDefault = !page404.relativePath && page404.absolutePath && true;
  res.status(404).render(page404.relativePath ?? page404.absolutePath, Object.assign(data404, isDefault ? {
    cache: isDefault,
    delimiter: isDefault ? 'A': '%',
    filename: page404.relativePath ?? page404.absolutePath,
  }: {}));
}