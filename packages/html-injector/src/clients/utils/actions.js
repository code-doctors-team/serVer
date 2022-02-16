import { findParent, findNode, nodesCreated, nodesDeleted, filterChildren } from './find';
import FromFiberToNode from './FromFiberToNode';

const addNodesDeletion = (nodes, index) => {
  if(Array.isArray(nodes)) {
    const nodesFiltered = nodes.filter(filterChildren).filter(node => node.dataset);
    nodesFiltered.forEach((node, i) => node.dataset.place = i);
    nodesDeleted.push(...nodesFiltered);
    return;
  };
  const node = nodes;
  if(node.dataset) {
    node.dataset.place = index;
    nodesDeleted.push(node);
  }
};

const attributesToMap = (attributes) => {
  const mapAttributes = new Map();
  attributes.forEach(attribute => mapAttributes.set(attribute, attribute))
  return mapAttributes;
}

/**
 * @name updateAttributes
 * @param {HTMLElement} node
 * @param {Object} newAttributes
 */
const updateAttributes = (node, newAttributes) => {
  const keysAttributes = Object.keys(newAttributes);
  const attributes = attributesToMap([...node.attributes]);
  keysAttributes.forEach(key => {
    const value = Reflect.get(newAttributes, key);
    const existKeyInNode = node.hasAttribute(key);
    const nodeAttribute = existKeyInNode && node.getAttributeNode(key);
    if(nodeAttribute) {
      if(nodeAttribute.value !== value) node.setAttribute(key, value);
      attributes.delete(nodeAttribute);
      return;
    }
    if(!existKeyInNode) return node.setAttribute(key, value);
  });
  attributes.forEach((attribute) => {
    node.removeAttributeNode(attribute);
  })
};

const Update = ({ fiber, parents: parentsFind }) => {
  const parentDom = findParent(parentsFind, fiber?.parent?.uiid, fiber);
  const areTexts = fiber.alternate.tag === 'text' && fiber.tag === 'text';
  if(!areTexts && fiber.tag === fiber.alternate.tag) {
    const oldNode = findNode(parentDom, fiber);  
    updateAttributes(oldNode, fiber.props);
    return;
  }
  if(areTexts && (parentDom.nodeType === 10 || Array.from(parentDom.childNodes).length === 1)) {
    Reflect.set(parentDom, parentDom.nodeType === 1 && parentDom.tagName === 'PRE' ? 'innerHTML': 'textContent', fiber.props.nodeValue)
    return;
  }
  const oldNode = findNode(parentDom, fiber);
  if(oldNode) addNodesDeletion(oldNode, fiber.alternate.index);
  const nodeFiber = FromFiberToNode(fiber);
  if(fiber.uiid) {
    nodesCreated.set(fiber.uiid, nodeFiber);
  }
  if(typeof nodeFiber === 'string' && oldNode.nodeType === 3) {
    Reflect.set(oldNode, 'textContent', nodeFiber)
    return;
  }
  oldNode.replaceWith(nodeFiber);
};

const Placement = ({ parents: parentsFind, fiber, effect, prevFiber }) => {
  const parentDom = findParent(parentsFind, fiber?.parent?.uiid, fiber);
  const nodeFiber = FromFiberToNode(fiber);
  
  if(fiber.uiid) nodesCreated.set(fiber.uiid, nodeFiber);

  const { sibling } = fiber;
  const isOnlyAppend = effect === 'only-append';
  const isAfterEnd = effect === 'after-end';
  if(parentDom.nodeType === 1 && parentDom.tagName === 'PRE') {
    return parentDom.innerHTML = nodeFiber;
  }
  if(isAfterEnd) {
    const prevFiberNode = findNode(parentDom, prevFiber);
    return prevFiberNode.after(nodeFiber);
  }
  if(sibling && !isOnlyAppend) {
    const domSibling = findNode(parentDom, sibling);
    return domSibling.before(nodeFiber);
  }
  if(fiber.index === 0) {
    return parentDom.prepend(nodeFiber);
  }
  parentDom.append(nodeFiber);
};

const Deletion = ({ parents: parentsFind, fiber }) => {
  const parentDom = findParent(parentsFind, fiber?.parent?.uiid);
  if(fiber.tag === 'all') {
    const { childNodes } = parentDom;
    const childNodesArray = [...childNodes];
    Reflect.set(parentDom, 'innerHTML', '');
    addNodesDeletion(childNodesArray);
    return;
  }
  const oldNode = findNode(parentDom, fiber);
  addNodesDeletion(oldNode, fiber.index);
  parentDom.removeChild(oldNode);
}

const actions = {
  [Update.name.toUpperCase()]: Update,
  [Placement.name.toUpperCase()]: Placement,
  [Deletion.name.toUpperCase()]: Deletion,
}

export default actions;