import { NextFunction, Request, Response } from "express";
import { createReadStream, ReadStream } from "fs";
import path from "path";
import config from "../config";

export default function middlewareAssets(req: Request, res: Response, next: NextFunction) {
  const assetsInit: string[] = ['/assets'];
  const assets: string = assetsInit.find(baseAsset => req.url.startsWith(baseAsset));
  if(!assets) return next();
  const url: string = req.url.replace(assets, '');
  const filename: string = path.resolve(config.assetsRoot, url[0] === '/' ? `.${url}` : url);
  const readFileAsset: ReadStream = createReadStream(filename);
  const extension: string = path.extname(url);
  const extensions = {
    '.css': config["#cssRoot"],
    '.js': config["#jsRoot"],
  };
  if(extensions[extension]) {
    return next(`Change file ${path.basename(filename, extension).concat(extension)} to ${extensions[extension]} directory`);
  }
  readFileAsset.pipe(res)
}