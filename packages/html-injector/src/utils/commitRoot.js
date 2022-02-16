import { wipRoot } from './createDomAndProcess';
import { NoAction, Deletion, Placement } from './actionsType';
import { dispatch, createParentsArray, commitDeletion } from './actions';
import { nanoid } from 'nanoid';

const commitWork = (fiber, prevFiber) => {
  if(!fiber) return;
  const nextFiber = fiber.sibling;
  if(fiber.action !== NoAction) {
    if(fiber.parent.action === Deletion) return;
    const dispatchReturn = { fiber };
    if(fiber.action === Placement) {
      let isOnlyAppend = false;
      let isAfterEnd = false;
      if(prevFiber?.action === NoAction || prevFiber?.action === Placement && prevFiber?.tag !== 'text') {
        isAfterEnd = true;
      }else if(nextFiber?.action === Placement || (prevFiber?.action === NoAction && prevFiber?.tag === 'text')) {
        isOnlyAppend = true;
      }
      Reflect.set(dispatchReturn, 'effect', isOnlyAppend ? 'only-append' : (isAfterEnd ? 'after-end' : null))
      if(isAfterEnd) {
        Reflect.set(dispatchReturn, 'prevFiber', {
          ...prevFiber,
          prevFiber: true
        })
      }
    }
    if(fiber.action !== Deletion && fiber.tag !== 'text') {
      Reflect.set(fiber, 'uiid', nanoid());
    }
    const parentsFiber = createParentsArray(fiber);
    Reflect.set(dispatchReturn, 'parents', parentsFiber)
    dispatch(dispatchReturn, fiber.action.description)
  }
  if(fiber.action !== Deletion) {
    commitWork(fiber.child);
    commitWork(nextFiber, fiber);
  }
};

export default function commitRoot(effect, cb) {
  if(effect === 'connection') {
    cb(wipRoot.value);
    return Reflect.set(wipRoot, 'value', null);
  }
  commitDeletion(deletion => {
    deletion.forEach(commitWork);
  });
  commitWork(wipRoot.value.child);
  cb(wipRoot.value);
  Reflect.set(wipRoot, 'value', null);
}