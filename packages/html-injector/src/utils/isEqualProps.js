const isFunc = (element) => element instanceof Function;

const isValueEqual = (firstPropValue, secondPropValue) => {
    if(isFunc(firstPropValue) && isFunc(secondPropValue)) return true;
    if(typeof firstPropValue === 'object' && typeof secondPropValue === 'object') return isEqualProps(firstPropValue, secondPropValue);
    return firstPropValue === secondPropValue;
};

const isEqualProps = (oldProps, actualProps) => {
  if(!oldProps || !actualProps) return false;
  const [oldPropsKeys, actualPropsKeys] = [Object.keys(oldProps), Object.keys(actualProps)];
  if(oldPropsKeys.length === 0 && actualPropsKeys.length || actualPropsKeys.length === 0 && oldPropsKeys.length) return false;
  if(oldPropsKeys.length && actualPropsKeys.length) {
    let isEqual = true;
    if(oldPropsKeys.length < actualPropsKeys.length) {
        actualPropsKeys.forEach((actualProp) => {
          const PropExistingInOldProps = oldPropsKeys.find(oldProp => actualProp === oldProp);
          const isExistingInOldProps = Boolean(PropExistingInOldProps);
          if(!isExistingInOldProps) {
            isEqual = false;
            return;
          }
          const isEqualValue = isValueEqual(actualProps[actualProp], oldProps[PropExistingInOldProps])
          if(!isEqualValue) {
            isEqual = false;
          }
        })
    } else {
      oldPropsKeys.forEach((oldProp) => {
          const PropExistingInActualProps = actualPropsKeys.find(actualProp => actualProp === oldProp);
          const isExistingInActualProps = Boolean(PropExistingInActualProps);
           if(!isExistingInActualProps) {
            isEqual = false;
            return;
          }
          const isEqualValue = isValueEqual(oldProps[oldProp], actualProps[PropExistingInActualProps])
          if(!isEqualValue) {
            isEqual = false;
          }
        })
    }
    return isEqual;
  }
  return true;
}

export default isEqualProps;