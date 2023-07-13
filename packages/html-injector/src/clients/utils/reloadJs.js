const generateNewUrl = (url) => {
  const urlChunks = url.split("?");
  if (urlChunks.length > 1) return urlChunks[0].concat(`?mtime=${Date.now()}`);
  return `${url}?mtime=${Date.now()}`;
};

const createNewScript = (url, oldScript) => {
  const script = document.createElement("script");
  script.setAttribute("src", url);
  oldScript.after(script);
  return script;
};

const updateScript = (script) => {
  const newUrl = generateNewUrl(script.getAttribute("src"));
  const newScript = createNewScript(newUrl, script);
  newScript.addEventListener("load", () => script.remove());
};

const reloadJs = () => {
  const initJs = ["js", "scripts", "/js", "/scripts"];
  const scripts = [...document.querySelectorAll("script")].filter(
    (script) => !script.hasAttribute("sv-script")
  );

  scripts
    .filter((script) =>
      initJs.find((init) => script.getAttribute("src")?.startsWith(init))
    )
    .forEach((script) => {
      updateScript(script);
    });
};

export default reloadJs;
