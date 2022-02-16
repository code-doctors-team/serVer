import assetsOperation from "../buildOperations/assets.operation";
import config from "../config";
import Data from "../data";
import Router from "../router";

function initialConfig() {
  config.data = new Data();
  config.router = new Router(config);
}

initialConfig();

export default function build({ info }: { info: boolean }) {
  config.type = 'build';
  import('../buildOperations/pages.operation')
    .then(({ default: pagesOperation }) => {
      pagesOperation(config)
        .then(assetsOperation)
        .then(() => {
          if(config.spinner.errors.size) {
            config.spinner.stop('Process build is finished but found complications ->')
          }else {
            config.spinner.stop('Create bundle of your proyect!')
          }
          config.events.emit('ready');
          if(info) {
            import('./showInfo')
              .then(({ default: showInfo }) => showInfo(config))
          }
        })
    })
}

