/**
 * This function add the attributes to element || Esta función añade los atributos al elemento
 * @param {Object} attributes are the attributes of element
 * @param {Object} element is the element to be iterated
 */
export default function setAttributes(attributes, element) {
  Object.keys(attributes).forEach((key = '') => {
    const value = Reflect.get(attributes, key);
    element.setAttribute(key, value);
  })
}