import * as esbuild from 'esbuild';
import { join, resolve } from 'path';
import htmlInjector from '@sv-cd/html-injector';
import internal, { Writable } from "stream";
import * as glob from "fast-glob";
import requireFromString from 'require-from-string';

import Router from '../router';
import spinner from '../libs/spinner';
import config from '../config';
import { handleError } from '../error/handle';
import logger from '../libs/logger';

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
  }>[] = Object.entries(data)
          .map(async ([key_data, value]: [string, any]) => ({
            name: key_data,
            data: await (isFunc(value) ? value() : (
              typeof value === 'object' ? (
              Array.isArray(value) ? value : addDataFuncs(value)
            ): value)),
          }));
  const NewData = await Promise.all(newData);
  NewData.forEach(({ name, data: data_new }) => Reflect.set(all, name, data_new));
  return all;
};

const filterPaths = (object: Object): Object => {
  const newObj: Object = {};
  const newKeys: string[] = Object.keys(object).filter((key: string) => !key.startsWith('/') && !key.startsWith(':'));
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
  
  public get = (url: string): DataPage | null => this.data.get(url) || null;

  public defaultPath: string = './config.data.js';

  #addData = (value: { [key: string]: any }, parsedKey: string): Promise<void> => {
    const keys: string[] = Object.keys(value);
    const objectFiltered = filterPaths(value);
    return new Promise(res => {
      let index: number = 0;
      keys.forEach(async (key: string) => {
        let subValue: DataPage = Reflect.get(value, key);
        if(key.startsWith(':')) {
          subValue = await addDataFuncs({ value: subValue });
          const { value: pageDinamyc } = subValue;
          const pageDinamycPromise: Promise<void> = new Promise(res => {
            let index_page_dinamyc = 0;
            if(Array.isArray(pageDinamyc)) {
              pageDinamyc.forEach(async (val: string | [string, any] | {
                name: string,
                data: any,
              }) => {
                switch(typeof val) {
                  case 'string': 
                    config.router.loadTemplateRoute(val, key, parsedKey);
                    break;
                  case 'object':
                    if(Array.isArray(val)) {
                      const [name, data]: [string, any] = val;
                      const route = config.router.loadTemplateRoute(name, key, parsedKey);
                      const data_page = await addDataFuncs(data);
                      if(route) await this.#addData({
                        ...data_page,
                        [key.slice(1)]: name.startsWith('/') ? name.slice(1) : name,
                      }, join(parsedKey, name));
                    }else {
                      const { name, data } = val;
                      const route = config.router.loadTemplateRoute(name, key, parsedKey);
                      const data_page = await addDataFuncs(data);
                      if(route) await this.#addData({
                        ...data_page,
                        [key.slice(1)]: name.startsWith('/') ? name.slice(1) : name,
                      }, join(parsedKey, name));
                    }
                    break;
                }
                if(index_page_dinamyc === pageDinamyc.length - 1) return res();
                index_page_dinamyc++;
              })
            }else {
              Object.entries(pageDinamyc).forEach(async (
                [name, data]
              ) => {
                const route = config.router.loadTemplateRoute(name, key, parsedKey);
                if(data) {
                  const data_page = await addDataFuncs(data);
                  if(route) await this.#addData({
                    ...data_page,
                    [key.slice(1)]: name.startsWith('/') ? name.slice(1) : name,
                  }, join(parsedKey, name));
                }
                if(index_page_dinamyc === pageDinamyc.length - 1) return res();
                index_page_dinamyc++;
              })
            }
          })
          await pageDinamycPromise;
        }else {
          subValue = await addDataFuncs(value);
          if(key.startsWith('/')) {
            const subParsedKey: string = Router.createUrl(join(parsedKey, key.slice(1)));
            await this.#addData(Object.assign(objectFiltered, subValue), subParsedKey);
          };
        }
        
        if(keys.length - 1 === index) {
          this.data.set(parsedKey, objectFiltered);
          return res();
        }
        index++;
      })
    })
  };

  waitingReady =  new Set<any[]>();

  onReady = () => {
    config.events.on('ready', () => {
      this.waitingReady.forEach((messages: any[]) => console.log(...messages))
    })
  }

  logConfigData = (logs: Set<any[]>) => {
    if(!logs) return;
    if(config.ready) {
      logs.forEach(log => console.log(...log));
      return;
    }
    logs.forEach(log => this.waitingReady.add(log));
    if(init) this.onReady();
  };

  protected stringToJsAndAddData = (content: string): Promise<void> => {
    this.content = content;
    const contentParsed = requireFromString(content);
    const urls: string[] = Object.keys(contentParsed).filter(key => key !== '__sv__log__');
    this.logConfigData(contentParsed['__sv__log__']);
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
          inject: [resolve(__dirname, './bind_console.js')],
          format: 'cjs',
          platform: 'node',
          watch: config.type === 'dev' && {
            onRebuild: (error, { 
              outputFiles,
            }) => {
              if(error) {
                handleError(error, 'data');
                return;
              }
              logger.logString`{hex('#6AFF4B') {italic Reload config.data.js}}`;
              const [result] = outputFiles;
              this.stringToJsAndAddData(result.text)
              .then(() => {
                this.sv().reload(null, htmlInjector.name, {})
                cb()
              })
              .catch((err: Error) => {
                handleError(err, 'data');
                cb()
              })
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
          // console.log(this.)
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
    pathConfigStream
      .pipe(this.WritablePathConfigStream())
      .on('finish', () => {
        spinnerInstance.text = 'Data upload finished';
        if(config.type === 'dev') {
          spinnerInstance.text = 'Testing internet...';
        }
        this.callback();
      });
  }
}