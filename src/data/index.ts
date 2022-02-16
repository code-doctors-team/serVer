import * as esbuild from 'esbuild';
import { join } from 'path';
import htmlInjector from '@sv-cd/html-injector';
import internal, { Writable } from "stream";
import * as glob from "fast-glob";
import requireFromString from 'require-from-string';

import Router from '../router';
import spinner from '../libs/spinner';
import config from '../config';
import { handleError } from '../error/handle';

export type DataPage =  {
  [key: string]: any | Promise<any>
};

let init = true;

class WritablePathConfig extends Writable {
  stringToJsAndAddData: (content: string) => void;
  sv: any;
  constructor(config: internal.WritableOptions & { sv: any, stringToJsAndAddData: (content: string) => void,  write: (this: internal.Writable & { stringToJsAndAddData: (content: string) => void  }, chunk: any, encoding: BufferEncoding, callback: (error?: Error) => void) => void }) {
    super(config);
    this.stringToJsAndAddData = config.stringToJsAndAddData;
    this.sv = config.sv;
  }
  
}

const isFunc = (element: any): boolean => element instanceof Function && typeof element === 'function';

const addDataFuncs = async (data: DataPage) => {
  const all = {};
  const newData: Promise<{
    name: string,
    data: DataPage,
  }>[] = Object.keys(data).map(async (key_data: string) => {
    const value = data[key_data];
    return {
      name: key_data,
      data: await (isFunc(value) ? value() : value),
    };
  });
  const NewData = await Promise.all(newData);
  NewData.forEach(({ name, data: data_new }) => Reflect.set(all, name, data_new));
  return all;
};

const filterPaths = (object: Object): Object => {
  const newObj: Object = {};
  const newKeys: string[] = Object.keys(object).filter((key: string) => !key.startsWith('/'));
  newKeys.forEach(key => Reflect.set(newObj, key, object[key]));
  return newObj;
};

export default class Data {
  [x: string]: any;

  root: string;
  
  data: Map<string, DataPage>;

  callback: () => void;

  constructor(sv?: any) {
    this.data = new Map();
    this.sv = sv;
    this.stringToJsAndAddData = this.stringToJsAndAddData.bind(this);
  }

  #stringToObject = (cb: (data: DataPage) => void) => {
    const pathConfigStream: NodeJS.ReadableStream = glob.stream(this.defaultPath, {
      cwd: process.cwd(),
    });
    pathConfigStream.pipe(this.WritablePathConfigStream((content: string) => {
      const contentParsed = requireFromString(content);
      cb(contentParsed);
    }))
  }

  public load = (url: string): Promise<DataPage|void> => new Promise(res => {
    this.#stringToObject((data) => {
      const urlResolve = url === '/404' ? 'notFound' : Router.createUrl(url);  
      const dataPage = data[urlResolve];
      return res(dataPage || null)
    })
  });
  
  public get = (url: string): DataPage | null => this.data.get(url) || null;

  public defaultPath: string = './config.data.js';

  #addData = (value: { [key: string]: any }, parsedKey: string): Promise<void> => {
    const keys: string[] = Object.keys(value);
    const objectFiltered = filterPaths(value);
    return new Promise(res => {
      let index: number = 0;
      keys.forEach(async (key: string) => {
        let subValue: DataPage = Reflect.get(value, key);
        subValue = await addDataFuncs(value);
        if(key.startsWith('/')) {
          const subParsedKey: string = Router.createUrl(join(parsedKey, key.slice(1)));
          await this.#addData(Object.assign(objectFiltered, subValue), subParsedKey);
        };
        if(keys.length - 1 === index) {
          this.data.set(parsedKey, objectFiltered);
          return res();
        }
        index++;
      })
    })
  };


  protected stringToJsAndAddData = (content: string): Promise<void> => {
    this.content = content;
    const contentParsed = requireFromString(content);
    const urls: string[] = Object.keys(contentParsed);
    return new Promise(res => {
      let index: number = 0;
      urls.forEach(async (url: string) => {
        let dataUrl: DataPage = Reflect.get(contentParsed, url);
        dataUrl = await addDataFuncs(dataUrl);
        const parsedUrl: string = Router.createUrl(url === 'notFound' ? '404' : url);
        await this.#addData(dataUrl, parsedUrl);
        if(urls.length - 1 === index) return res();
        index++;
      });
    })
  }

  private WritablePathConfigStream = (callback?: (content: string) => void) => new WritablePathConfig({
    write(chunk: Buffer, _encoding: BufferEncoding, cb: (error?: Error) => void) {
      if(init){
        esbuild.build({
          entryPoints: [chunk.toString()],
          write: false,
          bundle: true,
          format: 'cjs',
          platform: 'node',
          watch: config.type === 'dev' && {
            onRebuild: (error, { 
              outputFiles 
            }) => {
              if(error) {
                handleError(error, 'data');
              }
              const [result] = outputFiles;
              this.stringToJsAndAddData(result.text)
              .then(() => {
                this.sv().reload(null, htmlInjector.name, {})
                cb()
              });
            },
          },
          logLevel: 'silent',
        })
        .then(
          ({ errors, outputFiles: [result] }) => {
            if(errors.length) return Promise.reject(errors)
            return (callback || this.stringToJsAndAddData)(result.text);
          }
        )
        .then(() => {
          init = false;
          cb();
        })
        .catch(err => {
          handleError(err, 'data');
          cb();
        });
      }
    },
    stringToJsAndAddData: this.stringToJsAndAddData,
    sv: () => this.sv,
  })

  public loadData = (callback?: (newData: Map<string, DataPage>) => void) => {
    this.callback = callback?.bind(this, this.data) || (() => {});
    const pathConfigStream: NodeJS.ReadableStream = glob.stream(this.defaultPath, {
      cwd: process.cwd(),
    });
    const spinnerInstance = spinner();
    spinnerInstance.text = 'Loading data -- config.data.js';
    pathConfigStream.pipe(this.WritablePathConfigStream()).on('finish', () => {
      spinnerInstance.text = 'Data upload finished';
      if(config.type === 'dev') {
        spinnerInstance.text = 'Testing internet...';
      }
      this.callback();
    });
  }
}