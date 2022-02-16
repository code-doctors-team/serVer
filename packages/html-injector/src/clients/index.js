import actions from './utils/actions';
import handleExit, { handleClearDomKeys } from './utils/handles';

const io = window.__ioSv__;

Object.keys(actions).forEach(actionName => {
  const action = Reflect.get(actions, actionName);
  io.on(actionName, action);
})

io.on('clear-dom-keys', handleClearDomKeys);
io.on('exit', handleExit)