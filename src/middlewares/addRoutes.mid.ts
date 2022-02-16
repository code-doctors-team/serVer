import { NextFunction, Request, Response } from "express";
import config from "../config";

export default function addRoute(req: Request, res: Response, next: NextFunction) {
  const page = config.router.get(req.url);
  if(page) {
    const dataUrl = config.data.get(page.url);
    const parent = page.root !== page.url && page.root !== '/' && !dataUrl && config.data.get(page.root) || {};
    res.render(page.relativePath, Object.assign(dataUrl || {}, parent));
    return;
  }
  next();
}