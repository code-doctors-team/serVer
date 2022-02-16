import path from "path";
import cssProcess, { TransformOptions, TransformResult } from '@parcel/css';
import config from "../config";
import logger from '../libs/logger';
import cssInjector from '@sv-cd/css-injector';
import { createReadStream, existsSync } from "fs";
import { Transform } from "stream";
import resolveId from "../libs/resolveId";
import { handleError } from "../error/handle";

export interface CssReturn {
  loadCss(callback: (code: string) => void): void;
  loadCssPromise(): Promise<string | Buffer>;
  stream: Transform;
};

export type CssOptions = TransformOptions & { build?: boolean };

const generateOptionsDefault = (filename: string, code: string | Buffer) => ({
  filename,
  code: Buffer.from(code),
  analyzeDependencies: true,
  drafts: {
    nesting: true,
  }
});

async function resolveDependencie(dependencie: cssProcess.Dependency, optionsBuild: CssOptions, index: number, callback?: (code: string) => void) {
  if(dependencie.type === 'import') {
    const dir: string = path.dirname(dependencie.loc.filePath);
    const extension: string = path.extname(dependencie.loc.filePath);
    if(!extension) dependencie.loc.filePath += '.css';
    const errors: Set<string> = new Set();
    const absolutePath: string = path.resolve(dir, dependencie.url);
    const isRelativeAtFile: boolean = existsSync(absolutePath);
    if(isRelativeAtFile) {
      if(config.type === 'build') {
        try {
          const { loadCssPromise } = css(absolutePath, true, Object.assign(optionsBuild || {}, {
            ...optionsBuild,
            build: true,
          }));
          const newCss: string | Buffer = await loadCssPromise();
          this.codeFinally = newCss.toString().concat(this.codeFinally.toString());
        } catch(err) {
          errors.add(logger.chalk`Not found ${dependencie.url}: {hex("#26DDFF") {bold [Line: ${dependencie.loc.start.line}, Columns: (${dependencie.loc.start.column} - ${dependencie.loc.end.column})]}}`);
        }
      }else {
        if(cssInjector.cache.has(path.resolve(dir, dependencie.url))) {
          const dependencies: string[] = cssInjector.cache.get(path.resolve(dir, dependencie.url));
          dependencies.push(this.filename)
        }else {
          cssInjector.cache.set(path.resolve(dir, dependencie.url), [this.filename]);
        }
        this.codeFinally = `@import url("${dependencie.url}");\n`.concat(this.codeFinally.toString());
      }
    } else {
      try {
        const urlId: string = resolveId(dir, dependencie.url)
        const { loadCssPromise } = css(urlId, true, optionsBuild);
        const newCss: string | Buffer = await loadCssPromise();
        this.codeFinally = newCss.toString().concat(this.codeFinally.toString());
      } catch(err) {
        errors.add(logger.chalk`Not found ${dependencie.url}: {hex("#26DDFF") {bold [Line: ${dependencie.loc.start.line}, Columns: (${dependencie.loc.start.column} - ${dependencie.loc.end.column})]}}`);
      }
    }
    if(index === this.dependencies.length - 1) {
      callback(this.codeFinally);
      if(this.cb) this.cb();
      return errors.forEach((error: string) => handleError(Error(error), 'css'));
    } 
    index++;
  }
};

const transformCss = (filename: string, code: string | Buffer, callback?: (code: string) => void, optionsBuild?: CssOptions): string => {
  /**
   * TODO: Transform CSS -> Css processed (optimizated or resolved imports)
   */
  const { code: codeProcessed, dependencies } = cssProcess.transform(Object.assign(optionsBuild, generateOptionsDefault(filename, code)));

  let codeFinally: string = codeProcessed.toString();
  if(dependencies && dependencies.length) {
    let index: number = 0;
    dependencies.forEach(async (dependencie: cssProcess.Dependency): Promise<void> => {
      await resolveDependencie.call({
        codeFinally,
        filename,
      }, dependencie, optionsBuild, index, callback);
    })  
  } else {
    callback(codeFinally.toString());
  }
  return codeFinally.toString();
}

export default function css(url: string, isAbsolute: boolean = false, optionsBuild: CssOptions = {
  code: Buffer.from(''),
  filename: '',
}): CssReturn {
  const filename: string = isAbsolute ? url : path.resolve(config.cssRoot, url[0] === '/' ? `.${url}` : url);
  if(!existsSync(filename)) {
    logger.log(logger.chalk`Not found {hex("#33FFDC") {bold [${url[0] === '/' ? `.${url}` : url}]}} in root {hex("#33FFDC") {bold ${config.cssRoot}}}`);
    throw Error(`Not found ${filename} in root ${config.cssRoot}`);
  }
  const readFileCSS = createReadStream(filename);
  return {
    loadCss(callback?: (code: string) => void) {
      let code: string | Buffer = '';
      readFileCSS
      .on('data', (chunk: string | Buffer): void => {
        transformCss(filename, Buffer.from(chunk), (code => {
          code += code;
        }), optionsBuild);
      })
      .on('end', () => callback(code.toString()));
    },
    loadCssPromise: (): Promise<string | Buffer> => {
       return new Promise(res => {
         readFileCSS
         .on('data', (chunk: string | Buffer): void => {
           transformCss(filename, Buffer.from(chunk), res, optionsBuild);
         })
       })
    },
    get stream(): Transform {
      const transformCss = new Transform({
        write(chunk, encoding, cb) {
          try {
            const { code, dependencies }: TransformResult = cssProcess.transform(Object.assign(optionsBuild, generateOptionsDefault(filename, chunk)));
          
            let codeFinally: string = code.toString();
          
            if(dependencies && dependencies.length) {
              let index = 0;
              dependencies.forEach(async (dependencie: cssProcess.Dependency): Promise<void> => {
                await resolveDependencie.call(Object.assign(this, {
                  codeFinally,
                  filename,
                }), dependencie, optionsBuild, index, this.push);
              })    
            }else {
            this.push(codeFinally);
            cb()
            }
          } catch(err) { 
            handleError(err, 'css');
            if(err.source) {
              this.push(`Error: ${err.message}\nSource: \`${err.source}\`\nMore information in terminal.`);
            }
            cb();
          }
        }
      });
      return readFileCSS.pipe(transformCss);
    }
  };
  
}