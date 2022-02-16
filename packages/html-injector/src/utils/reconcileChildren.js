import isEqualProps from "./isEqualProps";
import { NoAction, Placement, Update, Deletion } from "./actionsType";
import { addDeletion } from "./actions";
import normalizeHTML from "../libs/normalizeHTML";

const mapRemainingChildren = (oldFiber) => {
  const existingChildren = new Map();
  let existingChild = oldFiber;

  while (existingChild) {
    if (typeof existingChild.index === 'number') {
      existingChildren.set(existingChild, existingChild);
    }
    existingChild = existingChild.sibling;
  }

  return existingChildren;
}

const isEqualElement = (oldFiber, element, areTexts) => {
  if(areTexts) {
    const sameTextNode = Boolean(oldFiber && element && oldFiber.dom.rawText === element.rawText);
    return sameTextNode;
  };
  const [sameType, sameProps] = (oldFiber && element && !areTexts &&
  [
    element.nodeType === oldFiber.dom.nodeType && oldFiber.tag === element.rawTagName, 
    isEqualProps(oldFiber.props, element.attributes),
  ]) || [];
  return oldFiber && element && sameType && sameProps;
}

const isDifferent = (fiberParent, element) => {
  const oldHTML = normalizeHTML(fiberParent.dom.innerHTML);
  const newHTML = normalizeHTML(element.innerHTML);
  return oldHTML !== newHTML;
}

const createIndex = (prevSibling, oldFiber, { isAction, index }) => prevSibling?.action === Placement ? prevSibling.index : ((isAction.placement || isAction.deletion) ? index : oldFiber.index);

export default function reconcileChildren(fiberParent, elements) {
  let index = 0;
  const isAction = {
    placement: false,
    deletion: false,
  };
  let prevSibling = null;
  let isPlacementEqualPrevSibling = false;
  let oldFiber = fiberParent.alternate?.child || null;
  const existingChildren = mapRemainingChildren(oldFiber);

  if(existingChildren.size && !elements.length) {
    if(!(fiberParent.action === Update && fiberParent.tag === fiberParent.alternate?.tag)) {
      addDeletion({
        action: Deletion,
        tag: 'all',
        parent: fiberParent.alternate,
      })
      return;
    }
  }

  const existingChildrenAtMutation = new Map(existingChildren);
  
  const ParentNotUpdateOrUpdateNotChange = fiberParent.action !== Update || fiberParent.tag === fiberParent.alternate?.tag;
  
  while(index < elements.length) {
    let isChanged = false;
    const element = Reflect.get(elements, index);
    const areTexts = element.nodeType === 3 && oldFiber?.dom.nodeType === 3;
    let newFiber = null;
    const isEqualElementAndFiber = isEqualElement(oldFiber, element, areTexts);
    if(isEqualElementAndFiber) {
      newFiber = {
        alternate: ParentNotUpdateOrUpdateNotChange ? oldFiber : null,
        action: ParentNotUpdateOrUpdateNotChange ? NoAction : Placement,
        dom: element,
        tag: areTexts ? 'text' : element.rawTagName,
        props: {
          ...(areTexts ? {
            nodeValue: oldFiber.dom.rawText.replace(new RegExp('\r', 'g'), '')
          } : element.attributes),
          children: element.childNodes
        },
        parent: fiberParent,
        index: createIndex(prevSibling, oldFiber, { isAction, index }),
        indexNew: {
          boolean: prevSibling?.action === Placement,
          value: index,
        },
      }
      existingChildrenAtMutation.delete(oldFiber);
    }
    if(newFiber && !isPlacementEqualPrevSibling) {
      let i = 1;
      let nextElement = Reflect.get(elements, index + i);
      if(nextElement && nextElement.rawTagName === newFiber.tag) {
        const elementsAreEqual = [];
        while(nextElement) {
          const isDiff = (isEqualElement({
            ...newFiber,
            props: newFiber.dom.attributes,
          }, nextElement, areTexts) ? isDifferent(newFiber.alternate, nextElement) : true);
          if(!isDiff && (existingChildren.size < elements.length)) {
            elementsAreEqual.push(nextElement);
          }
          if(elementsAreEqual.length > 1) {
            break;
          }
          i++;
          nextElement = Reflect.get(elements, index + i);
        }
        if(elementsAreEqual.length) {
          Reflect.set(newFiber, 'action', Placement);
          Reflect.set(newFiber, 'alternate', null);
          isChanged = true;
          isAction.placement = true;
          if(elementsAreEqual.length === 1) {
            isPlacementEqualPrevSibling = true;
          }
        }else {
          let nextOldFiber = oldFiber.sibling;
          let isFind = false;
          while(nextOldFiber) {
            const isDiff = (isEqualElement(nextOldFiber, element, areTexts) ? isDifferent(nextOldFiber, element) : true);
            if(!isDiff && (existingChildren.size > elements.length)) {
              isFind = true;
              break;
            }
            nextOldFiber = nextOldFiber.sibling;
          }
          if(isFind) {
            oldFiber = oldFiber.sibling;
            isAction.deletion = true;
            existingChildrenAtMutation.set(newFiber.alternate, newFiber.alternate);
            continue;
          }
        }
      }
    }else {
      isPlacementEqualPrevSibling = false;
    }
    if(oldFiber && element && !isEqualElementAndFiber) {
      let i = index;
      let nextElement = Reflect.get(elements, i + 1);
      let oldFiberExisting = false;
      while(nextElement) {
        const isEqualNextElementAndFiber = isEqualElement(oldFiber, nextElement, areTexts) && (existingChildren.size < elements.length) && !isDifferent(oldFiber, nextElement);
        if(isEqualNextElementAndFiber) {
          oldFiberExisting = true;
          break;
        }
        if(nextElement) {
          nextElement = Reflect.get(elements, i++);
        }
      }
      
      if(oldFiberExisting) {
        newFiber = {
          alternate: null,
          action: Placement,
          dom: element,
          tag: element.nodeType === 3 ? 'text' : element.rawTagName,
          props: {
            ...(element.nodeType === 3 ? {
              nodeValue: element.rawText.replace(new RegExp('\r', 'g'), '')
            } : element.attributes),
            children: element.childNodes
          },
          parent: fiberParent,
          index,
          indexNew: {
            boolean: prevSibling?.action === Placement,
            value: index,
          },
        }
        existingChildrenAtMutation.delete(oldFiber);
        isChanged = true;
        isAction.placement = true;
      }
      else {
        if(existingChildrenAtMutation.has(oldFiber)) {
          let oldFiberElement = oldFiber.sibling;
          let isFind = false;
          while(oldFiberElement) {
            const sameElement = isEqualElement(oldFiberElement, element, areTexts) && (existingChildren.size > elements.length) && !isDifferent(oldFiberElement, element);
            if(sameElement) {
              if(!newFiber) {
                isFind = true;
                break;
              }
            }
            if(oldFiberElement) {
              oldFiberElement = oldFiberElement.sibling;
            }
          }
          if(isFind) {
            oldFiber = oldFiber.sibling;
            isAction.deletion = true;
            continue;
          };
        }
      }
    }
    if(oldFiber && element && !newFiber) {
      newFiber = {
        alternate: ParentNotUpdateOrUpdateNotChange ? oldFiber : null,
        action: ParentNotUpdateOrUpdateNotChange ? Update : Placement,
        dom: element,
        tag: element.nodeType === 3 ? 'text' : element.rawTagName,
        props: {
          ...(element.nodeType === 3 ? {
            nodeValue: element.rawText.replace(new RegExp('\r', 'g'), '')
          } : element.attributes),
          children: element.childNodes
        },
        parent: fiberParent,
        index,
        indexNew: {
            boolean: prevSibling?.action === Placement,
            value: index,
          },
      }     
      existingChildrenAtMutation.delete(oldFiber);
    }
    if(!oldFiber && element && !isChanged) {
      newFiber = {
        alternate: null,
        action: Placement,
        dom: element,
        tag: element.nodeType === 3 ? 'text' : element.rawTagName,
        props: {
          ...(element.nodeType === 3 ? {
            nodeValue: element.rawText.replace(new RegExp('\r', 'g'), '')
          } : element.attributes),
          children: element.childNodes
        },
        parent: fiberParent,
        index,
        indexNew: {
          boolean: prevSibling?.action === Placement,
          value: index,
        },
      }
      isAction.placement = true;
    }
    
    if(index === 0) {
      fiberParent.child = newFiber;
    }else if(element) {
      prevSibling.sibling = newFiber;
    }
    if(oldFiber && !isChanged) {
      oldFiber = oldFiber.sibling;
    }
    prevSibling = newFiber;
    index++;
  }
  
  if(existingChildrenAtMutation.size && ParentNotUpdateOrUpdateNotChange){
    let idx = 0;
    existingChildrenAtMutation.forEach(value => {
      Reflect.set(value, 'action', Deletion);
      if(value.indexNew.boolean) {
        Reflect.set(value, 'index', value.indexNew.value)
      }
      Reflect.set(value, 'index', value.index - idx);
      addDeletion(value);
      idx++;
    })
  }
}