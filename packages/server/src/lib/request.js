import http from 'http';
import { URL } from 'url';

const urlFunction = (searchParams) => {
  const objectQuery = {};
  searchParams.forEach((value, name) => {
    let resolveValue = value;
    if(resolveValue === 'true') resolveValue = true;
    if(resolveValue === 'false') resolveValue = false;
    Reflect.set(objectQuery, name, resolveValue)
  })
  return objectQuery;
}
export default function createRequest(app) {
  return class Request extends http.IncomingMessage {
    constructor(param) {
      super(param)
      this.app = app;
      console.log(this.url)
      // this.urlResolve = new URL(this.url);
    }
    // get path() { return urlResolve.pathname };
    // get query() {
      // return urlFunction(urlResolve.searchParams);
    // }
  }
}