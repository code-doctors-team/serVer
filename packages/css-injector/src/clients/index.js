const io = window.__ioSv__;

const generateNewUrl = (url) => {
  const urlChunks = url.split("?");
  if (urlChunks.length > 1) return urlChunks[0].concat(`?mtime=${Date.now()}`);
  return `${url}?mtime=${Date.now()}`;
};

const createNewLink = (url, oldLink) => {
  const link = oldLink.cloneNode(true);
  link.setAttribute("href", url);
  oldLink.after(link);
  return link;
};
/**
 * @name updateLink
 * @param {HTMLElement} link
 */
const updateLink = (link) => {
  const newUrl = generateNewUrl(link.getAttribute("href"));
  const newLink = createNewLink(newUrl, link);
  newLink.addEventListener("load", () => link.remove());
};

/**
 * @name handleCss
 * @param {string} path
 */
const handleCss = (path) => {
  const initCss = ["css", "styles", "/css", "/styles"];
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
  links
    .map((link) => [
      initCss.find((init) => link.getAttribute("href")?.startsWith(init)),
      link,
    ])
    .filter(([isUrl]) => isUrl)
    .forEach(([init, link]) => {
      let url = link.getAttribute("href").split("?")[0].replace(init, "");
      url = url[0] === "/" ? url.slice(1) : url;
      if (path.includes(url)) updateLink(link);
    });
};

io.on("change_css", handleCss);
