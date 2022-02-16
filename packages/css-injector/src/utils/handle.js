import { resolve, relative } from 'path';
import { cache } from '../config';

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if(key === 'dom') return;
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

const objectToString = (object) => JSON.stringify(object, getCircularReplacer());

export default function handle(path, cssRoot, emit) {
  const pathCompleted = resolve(cssRoot, path);
  const cachePath = cache.get(pathCompleted);
  const parsedData = objectToString([...(cachePath || []), pathCompleted].map(url => relative(cssRoot, url)));
  // console.log(parsedData)
  emit('change_css', parsedData);
}