import requestUrl from "./requestUrl";
import createDomAndProcess from "./createDomAndProcess";
import normalizeHTML from "../libs/normalizeHTML";
import { actions, clearDomKeys } from "./actions";
import { cache } from "../config";

const DEPTH = 3;

export default async function initHTML(url, type, data) {
  let alternateRoot = null;
  actions.value = data;
  if (cache.has(url)) {
    alternateRoot = cache.get(url);
  }
  const html = await requestUrl(url);
  actions.value.emit("old-body", html);
  if (
    alternateRoot &&
    normalizeHTML(html).trim() === normalizeHTML(alternateRoot.html).trim()
  )
    return;
  createDomAndProcess(html, type, alternateRoot, (dom) => {
    if (dom) {
      cache.set(url, dom);
    }
    let depth = 0;
    let alternate = dom?.alternate;
    while (alternate) {
      depth++;
      if (DEPTH === depth) {
        clearDomKeys();
        Reflect.set(alternate, "alternate", null);
      }
      alternate = alternate.alternate;
    }
  });
}
