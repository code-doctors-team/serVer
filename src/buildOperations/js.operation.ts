import chalk from "chalk";
import { existsSync } from "fs";
import path from "path";
import config from "../config";

const urlsIncludes: Map<string, string> = new Map();

let existsJsRoot = true;

export default function jsOperation(urlScript?: string): Promise<string | void> | string {
  
  const initJs: string[] = ['js', '/js', 'scripts', '/scripts'];
  
  const urlJs: string = initJs.find(base => urlScript.startsWith(base));
  if(!urlJs) return urlScript;
  const url: string = urlScript.replace(urlJs.concat('/'), '');
  const newURL: string = path.resolve(config.jsRoot, url);
  return new Promise((res, rej) => {
    import('../utils/js')
    .then(
      ({ default: js }) => {
        if(urlsIncludes.has(newURL)) return res(urlsIncludes.get(newURL));
        if(!existsJsRoot) return res();
        if(!existsSync(config.jsRoot)){
          existsJsRoot = false;
          config.spinner.text = `Not found ${config['#jsRoot']}`;
          return res();
        }

        js([newURL], {
          minify: true,
          entryNames: '[dir]/[name]-[hash]',
          metafile: true,
          splitting: true,
        }, (code) => {
          let findKey = false;
          Object.entries(code.metafile.outputs).forEach(([key, value]) => {
            const { entryPoint } = value;
            const url = urlScript[0] === '/' ? urlScript.slice(1) : urlScript;
            if(entryPoint.includes(url)) {
              findKey = true;
              const parsedKey = path.parse(key);
              Reflect.set(parsedKey, 'dir', '/scripts');
              const newKey = path.format(parsedKey);
              urlsIncludes.set(newURL, newKey);
              const message: string = chalk`Loaded ${urlScript} -> Resolved: {hex('#AED6F1') ${newKey}}`;
              config.spinner.info.add(message)
              return res(newKey)
            };
          });
          if(!findKey) {
            urlsIncludes.set(newURL, null);
            return res()
          };
        })
    })
  })
}