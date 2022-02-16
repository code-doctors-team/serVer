import commitRoot from "./commitRoot";
import { nextUnitOfWork } from "./createDomAndProcess";
import performUnitOfWork from "./performUnitOfWork";

export default function workLoopAsync(effect, cb) {
  while(nextUnitOfWork.value) {
    Reflect.set(nextUnitOfWork, 'value', performUnitOfWork(
      nextUnitOfWork.value
    ));
  }
  commitRoot(effect, cb);
}