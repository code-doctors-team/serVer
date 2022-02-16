import { NextFunction, Request, Response } from "express";
import css from "../utils/css";

export default function middlewareCss(req: Request, res: Response, next: NextFunction) {
  const initCss: string[] = ['css', 'styles', '/css', '/styles'];
  const urlCss: string = initCss.find(base => req.url.startsWith(base)); 
  if(!Boolean(urlCss)) return next();
  let [url]: string[] = req.url.split('?');
  url = url.replace(urlCss, '');
  try {
    const { stream: streamCss } = css(url);
    res.set('Content-Type', 'text/css; charset=UTF-8');
    streamCss.pipe(res);
  }catch(err) {
    res.status(404).end(err.message);
  }
}