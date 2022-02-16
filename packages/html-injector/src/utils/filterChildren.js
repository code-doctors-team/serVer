const TYPE_TEXT = 3;
const TYPE_COMMENT = 8;

const filterChildren = (child) => {
  if(child.nodeType === 8) return false;
  if(child.nodeType === 3 && child.textContent.replace(new RegExp('(\r|\n)', 'g'), '').trim() === '') return false;
  return true;
}

export default filterChildren;