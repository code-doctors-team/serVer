import parse from "node-html-parser";
import { nodesCreated } from "./find";
import reloadJs from "./reloadJs";

const generateFullHTML = () => {
  let dO = document.doctype;
  const dtd = dO
    ? `<!DOCTYPE ${dO.name}${
        dO.publicId ? ' PUBLIC "' + dO.publicId + '"' : ""
      }${dO.systemId ? ' "' + dO.systemId + '"' : ""}`.trim() + ">\n"
    : "";
  const htmlOfPage = dtd.concat(document.documentElement.outerHTML);
  return htmlOfPage;
};

export const handleFinish = (oldBody, io) => {
  const newBody = generateFullHTML();

  const oldDom = parse(oldBody);
  window.__ids_script_sv__?.forEach((id, i) => {
    const script = oldDom.querySelector(`script[id="${id}"]`);
    if (i === 0) {
      const version = script.getAttribute("sv-version");
      const getUrl = () =>
        [location.protocol, "//", location.host, "/", `sv@${version}`].join("");
      script.setAttribute("src", getUrl());
      script.setAttribute("sv-script", "true");
      script.setAttribute("sv-version", version);
      script.removeAttribute("id");
      script.innerHTML = "";
    } else script.remove();
  });
  oldBody = oldDom.toString();

  window.__sv__nodes__listeners?.forEach((nodeListener) => {
    Object.entries(nodeListener.eventListenerList || {}).forEach(
      ([key, events]) => {
        events.forEach((event) => {
          nodeListener.removeEventListener(
            key,
            event.listener,
            event.useCapture
          );
        });
      }
    );
  });

  reloadJs();

  io.emit("check-html", oldBody, newBody);
};

export const handleClearDomKeys = () => {
  if (nodesCreated.size) {
    nodesCreated.clear();
  }
};

export default function handleExit() {
  console.log("Finish");
}
