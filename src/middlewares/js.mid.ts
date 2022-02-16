import { NextFunction, Request, Response } from "express";
import js from "../utils/js";

export default function middlewareJs(req: Request, res: Response, next: NextFunction) {
  const initJs: string[] = ['js', '/js', 'scripts', '/scripts'];
  const urlJs: string = initJs.find(base => req.url.startsWith(base)); 
  if(!Boolean(urlJs)) return next();
  let [url]: string[] = req.url.split('?');
  url = url.replace(urlJs, '');
  try {
    const { stream: streamJs } = js(url);
    res.set('Content-Type', 'application/javascript; charset=UTF-8');
    streamJs.pipe(res);
  }catch(err) {
    res.status(404).end(err.message);
  }
}