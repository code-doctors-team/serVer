import { pathToRegexp } from 'path-to-regexp';

export default function route(path) {
  const keys = []
  const newPath = pathToRegexp(path, keys);
  return [newPath, keys];
}