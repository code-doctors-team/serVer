import chalk from 'chalk';
import compressImages from 'compress-images';
import { stream as streamGlob } from 'fast-glob';
import { copyFile, existsSync, mkdir } from 'fs';
import path from 'path';
import config from '../config';
import { handleError } from '../error/handle';

type FileImageOptimized = {
  input: string,
  path_out_new: string,
  algorithm: string,
  size_in: any,
  size_output: any,
  percent: null,
  err: null,
};


const ImagesOptimize = (rootAssets: string) => new Promise((res, rej) => {
  const assetsRoot: string = config['#assetsRoot'];
  const extensions: string[] = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'svg', 'gif'];
  const extensionsIncorrects: string[] = ['css', 'js', 'ts', 'scss'];
  if(!existsSync(rootAssets)) return res({ extensionsExcepted: extensions.concat(extensionsIncorrects), rootAssets });
  const baseWithExtensions: string = path.join(assetsRoot, `/**/*.{${extensions.join(',')}}`);

  const callbackCompressImages = (err: Error, finished: boolean, file: FileImageOptimized) => {
    if(err) return rej(err);
    if(file) {
      config.spinner.text = `${chalk`Processed ${path.basename(file.input)}, using {hex("#AEF1B1") ${file.algorithm}} algorithm`}|Processed ${path.basename(file.input)}, using ${file.algorithm} algorithm`;
    }
    if(finished) return res({ extensionsExcepted: extensions.concat(extensionsIncorrects), rootAssets });
  };

  compressImages(
    baseWithExtensions, 
    rootAssets.concat('/'),
    { compress_force: false, statistic: false, autoupdate: true },
    false,
    { 
      jpg: { 
        engine: 'mozjpeg', 
        command: ['-quality', String(60)] ,
      }
    },
    { 
      png: { 
        engine: 'pngquant', 
        command: ['--quality=20-50', '-o'], 
      } 
    },
    { 
      svg: { 
        engine: 'svgo', 
        command: '--multipass', 
      }
    },
    {
      gif: { 
        engine: 'gifsicle', 
        command: ['--colors', String(64), '--use-col=web'], 
      },
    },
    callbackCompressImages,
  );
});

const CopyFileFromAssetsToBuild = (assetsRoot: string, file: string,  rootAssets: string, callbackError: (err: NodeJS.ErrnoException) => void): void => {
  const absolutePath: string = path.resolve(assetsRoot, file);
  const outputFile: string = path.resolve(rootAssets, file);
  copyFile(absolutePath, outputFile, (err: NodeJS.ErrnoException) => err && callbackError(err));
}

const CopyFiles = ({
  extensionsExcepted: extensionsIncorrects, 
  rootAssets,
}: {
  extensionsExcepted: string[],
  rootAssets: string,
}): Promise<void> => (
  new Promise((res, rej) => {
    const { assetsRoot } = config;

    const files = streamGlob('./**/*.*', {
      cwd: assetsRoot,
    });

    files
      .on('data', (chunk: Buffer | string) => {
        const file: string = chunk.toString();
        const extnameWithoutPoint: string = path.extname(file).slice(1);

        if(extensionsIncorrects.includes(extnameWithoutPoint)) return;
        
        if(!existsSync(rootAssets)) {
          return mkdir(rootAssets, {
            recursive: true,
          }, (err: NodeJS.ErrnoException) => err ? rej(err) : CopyFileFromAssetsToBuild(assetsRoot, file, rootAssets, rej));
        }

        CopyFileFromAssetsToBuild(assetsRoot, file, rootAssets, rej);
        
      })
      .on('finish', res);
  })
);

export default function assetsOperation(): Promise<void> {
  const rootAssets: string = path.resolve(config.dist, path.dirname(config["#assetsRoot"]) === '.' ? config["#assetsRoot"] : path.dirname(config["#assetsRoot"]));
  return new Promise((res) => {
    ImagesOptimize(rootAssets)
      .then(CopyFiles)
      .then(res)
      .catch((error) => {
        if(error) handleError(error, 'assets');
        res();
      })
  });
}