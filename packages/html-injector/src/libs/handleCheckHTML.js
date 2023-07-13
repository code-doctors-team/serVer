import createDomAndProcess from "../utils/createDomAndProcess";
import normalizeHTML from "./normalizeHTML";

const createDom = (dom, alternateRoot) =>
  new Promise((res) =>
    createDomAndProcess(dom, "connection", alternateRoot, res)
  );

export default async function handleCheckHTML(oldDom, newDom) {
  let alternateRoot = null;
  if (normalizeHTML(newDom).trim() === normalizeHTML(oldDom).trim()) return;

  alternateRoot = await createDom(newDom, alternateRoot);
  createDomAndProcess(oldDom, "check", alternateRoot, () => {});
}
