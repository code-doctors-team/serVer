export const actions = {
  value: null,
};

const deletions = [];

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if(key === 'dom') return value.innerHTML;
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

const objectToString = (object) => JSON.stringify(object, getCircularReplacer());

export const dispatch = (data, type) => {
  const dataString = objectToString(data);
  actions.value.emit(type, dataString);
}

export const addDeletion = (fiberToDelete) => {
  deletions.push(fiberToDelete);
};

export const createParentsArray = (fiber) => {
  let { parent } = fiber;
  const parentsFiber = [];
  while(typeof parent.index === 'number') {
    parentsFiber.push({
      index: parent.index,
      tag: parent.tag
    });
    parent = parent.parent;
  }
  return parentsFiber.reverse();
};

export const clearDomKeys = () => {
  actions.value.emit('clear-dom-keys', null);
}

export const commitDeletion = (cb) => {
  cb(deletions);
  Reflect.set(deletions, 'length', 0);
};
