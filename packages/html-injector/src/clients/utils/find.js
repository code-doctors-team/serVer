export const nodesCreated = new Map();

export const nodesDeleted = [];

export const filterChildren = (child) => {
  if(child.nodeType === 8) return false;
  if(child.nodeType === 3 && child.textContent.replace(new RegExp('(\r|\n)', 'g'), '').trim() === '') return false;
  return true;
}

const findWithUiid = (uiid) => {
  if(!uiid) return null;
  const parentDom = nodesCreated.get(uiid);
  if(parentDom) return parentDom;
  return null;
}

/**
 * @name findParent
 * @return {HTMLElement}
 */
export const findParent = (parentsFind, uiid, fiber) => {
  if(!parentsFind.length && !uiid) {
    if(fiber.tag === 'html') return document;
    return document.doctype;
  }; 
  const parentDomUiid = findWithUiid(uiid);
  if(parentDomUiid) return parentDomUiid;
  let index = 0;
  let parentDom = null;
  do {
    const parent = Reflect.get(parentsFind, index);
    if(parent.tag === 'html') parentDom = document.documentElement;
    else if(parent.tag === 'body' || parent.tag === 'head') parentDom = document[parent.tag];
    else {
      parentDom = Reflect.get([...parentDom.childNodes].filter(filterChildren), parent.index);
      if(parentDom) {
        if(process.env.DEV && parentDom.tagName !== parent.tag.toUpperCase()) {
            debugger;
            console.error('There did error', `${parentDom.tagName} ≠ ${parent.tag.toUpperCase()}`)
          }
        }
      }   
    index++;
  }
  while(parentDom && index < parentsFind.length);
  return parentDom;
};

/**
 * @name findNode
 * @return {HTMLElement}
 */
export const findNode = (parent, fiber) => {
  const parentDomUiid = findWithUiid(fiber.uiid);
  if(parentDomUiid) return parentDomUiid;
  const childNodes = [...parent.childNodes].filter(filterChildren);
  const node = Reflect.get(childNodes, fiber.index);
  const fiberTagName = (fiber.alternate?.tag ?? fiber.tag).toUpperCase();
  if(fiberTagName === 'TEXT') return node;
  if(process.env.DEV && node.tagName !== fiberTagName) {
    debugger;
    console.error('There did error', `${node.tagName} ≠ ${fiber.tag.toUpperCase()}`)
  }
  return node;
};
