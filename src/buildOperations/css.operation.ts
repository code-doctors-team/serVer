import chalk from "chalk";
import config from "../config";
import { CssOptions, CssReturn } from "../utils/css";

export const urlsInclude: Set<string> = new Set();

export const urlsCache: Map<string, string> = new Map();

export default async function cssOperation(url: string, isAbsolute: boolean = false, optionsBuild?: CssOptions): Promise<string | Buffer> {
  const { default: css } = await import('../utils/css');
  const contentCached: string = urlsCache.get(url);
  if(contentCached) return contentCached;
  const initCss: string[] = ['css', 'styles', '/css', '/styles'];
  const urlCss: string = initCss.find(base => url.startsWith(base)); 
  const newURL: string = url.replace(urlCss.concat('/'), '');
  const message: string = chalk`Loaded ${newURL} -> Resolved: {hex('#AED6F1') ${url}}`;
  config.spinner.info.add(message)
  const ResultCss: CssReturn = css(newURL, isAbsolute, optionsBuild);
  const content: string | Buffer = await ResultCss.loadCssPromise();
  if(!urlsCache.has(url)) urlsCache.set(url, content.toString());
  return content;
}