import actions from "./utils/actions";
import handleExit, { handleClearDomKeys, handleFinish } from "./utils/handles";

const io = window.__ioSv__;
let body = "";

Object.keys(actions).forEach((actionName) => {
  const action = Reflect.get(actions, actionName);
  io.on(actionName, action);
});

io.on("clear-dom-keys", handleClearDomKeys);
io.on("old-body", (bodyHTML) => (body = bodyHTML));
io.on("finish", () => handleFinish(body, io));
io.on("exit", handleExit);
