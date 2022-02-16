import server from '@sv-cd/server';
import { create } from '@sv-cd/server-reload';
import htmlInjector from '@sv-cd/html-injector';
import cssInjector from '@sv-cd/css-injector';

import config from '../config';
import addMiddlewaresAndRoutes from '../middlewares/addMiddlewaresAndRoutes';
import message from '../message';
import open from 'open';
import logger from './logger';

type OptionsDev = {
  open?: boolean | string,
  port: string,
  onlyReload?: boolean | string,
};

export let snippetSv = '';
export let urlSv = '';

const watchFiles = (sv: any): void => {
  const [watchedPages, watchedCss, watchedJs] = [sv.watch('./**/*.ejs', {
    cwd: config.pagesRoot,
  }), sv.watch('./**/*.css', {
    cwd: config.cssRoot,
  }), sv.watch('./**/*.js', {
    cwd: config.jsRoot,
  })]
  watchedPages
  .on('change', (path: string): void => {
    sv.reload(path, htmlInjector.name, {
      url: urlSv,
    })
  })
  .on('add', (path: string) => {
    if(config.ready) {
      if(!config.router.has(path)) {
        config.router.loadRoute(path);
      }
    }
  })
  .on('unlink', (path: string) => {
    if(config.ready) {
      if(config.router.has(path)) {
        config.router.delete(path);
      }
    }
  });
  watchedCss
  .on('change', (path: string): void => {
    sv.reload(path, cssInjector.name, {
      url: urlSv,
      cssRoot: config.cssRoot,
    })
  })
  watchedJs
  .on('all', (): void => {
    sv.reload();
  })
};

const selectPlugins = (onlyReload: OptionsDev['onlyReload']): any[] => {
  const plugins = [];
  switch(typeof onlyReload) {
    case 'boolean':
      !onlyReload && plugins.push(htmlInjector, cssInjector);
      break;
    case 'string':
      const select = {
        html: cssInjector,
        css: htmlInjector,
      };
      const plugin = select[onlyReload];
      if(plugin) plugins.push(plugin);
      break;
  };
  return plugins;
};

export default async function dev({ open: browser, port, onlyReload }: OptionsDev): Promise<Promise<void>> {
  const { version } = config;
  const serverReloadInstance = create(config.name);
  const plugins = selectPlugins(onlyReload);
  const sv = serverReloadInstance.init({
    port: Number(port),
    server,
    version,
    spinner: config.spinner,
    plugins,
  }, ({ url, snippet, urlExternal }): void => {
    snippetSv = snippet;
    urlSv = url;
    config.spinner.stop('Finish processing after init');
    console.log(message(urlExternal, url));
    config.ready = true;
    if(browser) {
      const browsers: {
        [browser: string]: string,
      } = {
        chrome: 'chrome',
        edge: 'msedge',
        firefox: 'firefox',
        opera: 'opera'
      };
      const browsersName: string[] = Object.keys(browsers);
      let browserSelected: string = browsers.chrome;
      let formatedBrowser: string = null;
      let notAvaible: string = null;
      if(typeof browser === 'string') {
        formatedBrowser = browser.toLowerCase();
        if(browsersName.includes(formatedBrowser)) browserSelected = browsers[formatedBrowser];
        else {
          formatedBrowser = null;
          notAvaible = browser;
        };
      };
      const name: string[] = [...new Set([browserSelected, 'chrome'])];
      open(url, {
        app: {
          name,
        }, 
        wait: true,
      })
      .then(({ app }) => {
        const trieds: string[] = name.slice(0,1).filter(browser => browser !== app.name);
        const [app_name]: [string, string] = Object.entries(browsers).find(([ _, value ]) => value === app.name);
        logger.logString`Opening browser {hex("#4BFF65") ${app_name}}${trieds.length ? logger.chalk` {hex("#FFFB26") (${trieds.join('|')}) Tried Browser}` : ''}${notAvaible ? logger.chalk` {hex("#FFFB26") (\`${notAvaible}\` not available browser)}`: ''}`;
      })
      .catch(err => {
        console.log('error', err)
      })
    }
  });
  Reflect.get(config, 'sv', sv);
  watchFiles(sv);
  addMiddlewaresAndRoutes(sv,{ version });
}