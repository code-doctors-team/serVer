import Spinner from '@sv-cd/cli-loader';
import { Command, CommandOptions, program } from 'commander';
import config from '../config';
import logger from '../libs/logger';
import saveData from '../libs/saveData';
import spinner from '../libs/spinner';

type ActionType = {
  [key: string]: {
    description?: string,
    optionsCommand?: CommandOptions,
    options?: Array<[tag: string, description: string, defaultValue: string | boolean]>
    action?: (...args: any[]) => void | Promise<void>,
  }
}

const cliActions = (program: Command) => {
  const actions: ActionType = {
    dev: {
      optionsCommand: {
        isDefault: true,
      },
      options: [
        ['--root <root>', 'Select root of pwd', '.'],
        ['--open [open_browser]', 'Open browser(Select Edge, Firefox, Opera(If you use opera GX, it will automatically open it) or Chrome)', false],
        ['-p,--port <port_number>', 'This is the port where you will work in development mode', '5000'],
        ['--pages <pages_root>', 'Select root of pages', './pages'],
        ['--styles <styles_root>', 'Select root of styles(css)', './src/styles'],
        ['--assets <assets_root>', 'Select root of assets(images and manifest.json)', './src/assets'],
        ['--scripts <scripts_root>', 'Select root of javascript(js)', './src/scripts'],
        ['--only-reload [specific_only_reload]', 'Specific only-reload, in css, html(Specific true, all will use strategy only-reload) )', false]
      ],
      description: 'Starting your proyect in mode development',
      action(options) {
        Reflect.set(config, 'root', options.root);
        Reflect.set(config, 'pagesRoot', options.pages)
        Reflect.set(config, 'cssRoot', options.styles)
        Reflect.set(config, 'assetsRoot', options.assets)
        Reflect.set(config, 'jsRoot', options.scripts)
        config.spinner.start('Initalizing mode -- dev');
        import('../libs/dev')
          .then(({ default: dev }) => dev(options));
      }
    },
    build: {
      description: 'Starting build of your project for production',
      options: [
        ['--root <root>', 'Select root of pwd', '.'],
        ['--dist <dist_proyect>', 'Is a place where will bundle of your project', 'public'],
        ['--pages <pages_root>', 'Select root of pages', './pages'],
        ['--styles <styles_root>', 'Select root of styles(css)', './src/styles'],
        ['--assets <assets_root>', 'Select root of assets(images and manifest.json)', './src/assets'],
        ['--scripts <scripts_root>', 'Select root of javascript(js)', './src/scripts'],
        ['--clear', `Delete the bundle folder before the initialization of the "build" processes`, false],
        ['--info', `Show more information about build process`, false]
      ],
      action(options) {
        Reflect.set(config, 'root', options.root);
        Reflect.set(config, 'pagesRoot', options.pages);
        Reflect.set(config, 'cssRoot', options.styles);
        Reflect.set(config, 'assetsRoot', options.assets);
        Reflect.set(config, 'jsRoot', options.scripts);
        Reflect.set(config, 'dist', options.dist);
        saveData(config['#dist']);
        if(options.clear) {
          import('../libs/DelFolder')
            .then(({ default: DelFolder }) => DelFolder(config))
            .then(() => config.spinner.start('Initalized mode -- build'));
        }else {
          config.spinner.start('Initalizing mode -- build')
        }
        config.spinner.setTextPromise('Loading operations...')
          .then(() => import('../libs/build'))
          .then(({ default: build }) => build(options))
      }
    },
    start: {
      description: 'Start your application for production',
      options: [
        ['--dist <dist_proyect>', 'Place where is your bundle of application', 'public'],
        ['-p,--port <port_number>', 'This is the port where you will work in development mode', '3000']
      ],
      action(options) {
        config.spinner.start('Initalized mode -- start')
        const promiveSaveData = new Promise(res => {
          saveData(null, 'get', (err, content) => {
            if(err) return res(config.dist);
            res(content);
          });
        })
        promiveSaveData
          .then(dist => {
            if(dist) Reflect.set(config, 'dist', dist);
            return import('../libs/prod');
          })
          .then(({ default: prod }) => prod(options));
      }
    }
  };

  Object.keys(actions).forEach(actionName => {
    const { action, optionsCommand, description, options } = actions[actionName];
    const command = program.command(actionName, optionsCommand || {});
    if(description) command.description(description);
    options.forEach(option => command.option(...option));
    command.action(action);
  })
}

export default function cli() {
  const { name } = config;
  const spinnerInstance: Spinner = spinner(name);
  logger.logString`Loading {hex('#FF9D4B') (cli)}`;
  Reflect.set(config, 'spinner', spinnerInstance);
  program
    .name(name)
    .version(config.version, '-v, --version', `${name} version`);
  cliActions(program);
  program.parse(process.argv)
};