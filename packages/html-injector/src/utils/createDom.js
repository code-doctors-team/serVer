import parse from "node-html-parser";
import workLoopAsync from "./workLoopAsync";

export const nextUnitOfWork = {
  value: null,
};
export const wipRoot = {
  value: null,
};

export default function createDom(stringDom, type, alternateRoot, cb) {
  const dom = parse(stringDom);

  wipRoot.value = {
    alternate: alternateRoot || null,
    dom,
    html: stringDom,
    props: {
      ...dom.attributes,
      children: dom.childNodes,
    },
  };
  nextUnitOfWork.value = wipRoot.value;
  workLoopAsync(type, cb);
}
