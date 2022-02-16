import chalk from 'chalk';
import { existsSync } from 'fs';
import path from 'path';
import { Readable, Transform } from 'stream';
import * as esbuild from 'esbuild';
import config from '../config';
import logger from '../libs/logger';
import { handleError } from '../error/handle';

function createStream(filename: string, optionsBuild?: esbuild.BuildOptions): Readable {
  const ReadableStream: Readable = new Readable({
    read() {},
  });
  const Write: Transform = new Transform({
    write(chunk: Buffer, _encoding, cb: () => void) {
      esbuild.build(Object.assign({
        entryPoints: [chunk.toString()],
        write: false,
        bundle: true,
        format: 'cjs',
        platform: 'browser',
        logLevel: 'silent',
      }, optionsBuild || {}))
        .then(({ outputFiles, warnings }) => {
          warnings.forEach((warn) => {
            logger.warn(chalk`{hex("#33FFDC") ${warn.text}}`)
          })
          const [result] = outputFiles;
          this.push(result.text);
          cb()
          this.end();
        })
        .catch(err => {
          handleError(err, 'js');
          let messageError = '';
          if(err.errors) err.errors.forEach((error: esbuild.PartialMessage) => {
            messageError = `console.log(\`%cError in js/index.js: [Line: ${error.location.line}, Column: ${error.location.column}]\nSource: ${error.text}\`, 'background-color: #FF4B4B; padding: .4em; border-radius: 0 .1em;font-weigth: bolder;color: black')\n`;
          })
          this.push(messageError);
          cb();
          this.end();
        });
    }
  })
  const StreamReturn = ReadableStream.pipe(Write);
  ReadableStream.push(filename);
  return StreamReturn;
};

export default function js(url?: string | string[], optionsBuild?: esbuild.BuildOptions, callback?: (code: esbuild.BuildResult) => void ) {
  if(Array.isArray(url)) {
    const rootJs: string = path.resolve(config.dist, './scripts');
    const urls: string[] = Array.from(url);
    esbuild.build(Object.assign({
      entryPoints: [...urls],
      write: true,
      outdir: rootJs,
      bundle: true,
      format: 'esm',
      platform: 'browser',
      logLevel: 'silent',
    }, optionsBuild)).then(callback).catch(err => handleError(err, 'js'));
    return;
  }
  const filename: string = path.resolve(config.jsRoot, url[0] === '/' ? `.${url}` : url);
  if(!existsSync(filename)) {
    logger.log(chalk`Not found {hex("#33FFDC") {bold [${url[0] === '/' ? `.${url}` : url}]}} in root {hex("#33FFDC") {bold ${config.jsRoot}}}`);
    throw Error(`Not found ${filename} in root ${config.jsRoot}`);
  }
  
  return {
    get stream() {
      const StreamJs: Readable = createStream(filename, optionsBuild);
      return StreamJs;
    }
  }
}