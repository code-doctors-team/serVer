import * as minifyHtml from "@minify-html/js";
import chalk from "chalk";
import ejs from "ejs";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdir,
  ReadStream,
  WriteStream,
} from "fs";
import path, { ParsedPath } from "path";
import { Transform, Writable } from "stream";
import htmlInjector, { HTMLElement } from "@sv-cd/html-injector";

import { DataPage } from "../data";
import cssOperation from "./css.operation";
import { configType } from "../config";
import { handleError } from "../error/handle";
import jsOperation from "./js.operation";

type LineProcessed = [HTMLElement, string];

type StatusLine = {
  NoLinksNoScripts: boolean;
  LinksAndScripts: boolean;
  OnlyLinks: boolean;
  OnlyScripts: boolean;
};

const { parse } = htmlInjector;

type Defaults = {
  index: "index";
  "404": "404";
};

const defaults: Defaults = {
  index: "index",
  "404": "404",
};

const filterMatch: (match: RegExp) => (line: string) => number =
  (match: RegExp) =>
  (line: string): number =>
    line.match(match)?.length;

const SplitInLines: (content: string) => string[] = (content: string) =>
  content
    .split("\n")
    .filter((line: string): string => line.trim())
    .map((line: string): string => line.trim());

const MapLines: (Lines: string[], match: RegExp) => LineProcessed[] = (
  Lines: string[],
  match: RegExp
) =>
  Lines.filter(filterMatch(match)).map(
    (LinesMatched: string): LineProcessed => [parse(LinesMatched), LinesMatched]
  );

function ProcessCSS(
  LinksAndStrings: LineProcessed[],
  content: string,
  cfg: any,
  config: configType,
  cb: () => void
) {
  LinksAndStrings.forEach(
    ([element, linkString]: LineProcessed, index: number): void => {
      const links: HTMLElement[] = element.querySelectorAll(
        'link[rel="stylesheet"]'
      );
      if (!links.length) {
        if (LinksAndStrings.length - 1 === index) {
          const contentHTML: Buffer = minifyHtml.minify(content, cfg);
          this.push(contentHTML);
          return cb();
        }
        return;
      }
      links.forEach(async (link: HTMLElement): Promise<void> => {
        const urlLink: string = link.getAttribute("href") || "";
        let contentCss: string | Buffer = await cssOperation(urlLink, false, {
          minify: true,
          filename: "",
          code: Buffer.from(""),
          build: config.type === "build",
        });
        contentCss = contentCss.toString();
        const newContent: string = `<style>${contentCss}</style>`;
        content = content.replace(linkString, newContent);
        if (LinksAndStrings.length - 1 === index) {
          const contentHTML: Buffer = minifyHtml.minify(content, cfg);
          this.push(contentHTML);
          cb();
        }
      });
    }
  );
}

function ProcessJS(
  ScriptsAndStrings: LineProcessed[],
  change: (scriptStringAtChange: string, newScript: string) => void
): Promise<void> {
  const formatUrl = (url: string): string =>
    url[0] !== "/" ? "/".concat(url) : url;
  const scriptsAndString_promise: Promise<void> = new Promise((resolve) => {
    let index_lines = 0;
    ScriptsAndStrings.forEach(
      async ([element, scriptString]: LineProcessed): Promise<void> => {
        const initJs: string[] = ["js", "/js", "scripts", "/scripts"];
        const scripts: HTMLElement[] = element.querySelectorAll("script");

        const scripts_promise: Promise<void> = new Promise((res) => {
          let index_script = 0;
          scripts.forEach(async (script) => {
            const urlScript: string = script.getAttribute("src") || "";
            const urlJs: string = initJs.find((base) =>
              urlScript.startsWith(base)
            );
            if (urlJs) {
              const newURL: string = urlScript.replace(urlJs, "/scripts");
              const js = jsOperation(newURL);
              if (typeof js === "string") {
                script.setAttribute("src", formatUrl(js));
                change(scriptString, script.toString());
              } else {
                const url = await js;
                if (url) {
                  script.setAttribute("src", formatUrl(url));
                  change(scriptString, script.toString());
                }
              }
              if (index_script === scripts.length - 1) return res();
              index_script++;
            }
          });
        });
        await scripts_promise;
        if (index_lines === ScriptsAndStrings.length - 1) return resolve();
        index_lines++;
      }
    );
  });
  return scriptsAndString_promise;
}

export default function pagesOperation(config: configType): Promise<void> {
  const { dist: rootPages } = config;

  const cfg: minifyHtml.Cfg = minifyHtml.createConfiguration({
    keep_spaces_between_attributes: true,
    keep_html_and_head_opening_tags: true,
    keep_closing_tags: true,
  });

  const { stream: RouterStream, routes }: typeof config.router = config.router;
  const { loadData, get }: typeof config.data = config.data;

  let maxIndex: null | number = null;
  let index: number = 0;

  return new Promise((res) => {
    const converLoadDataToPromise = new Promise((res) => loadData(res));
    converLoadDataToPromise.then(() => {
      const WriteStreamContent = new Writable({
        write(chunk, _encoding, cb) {
          const [absolutePath, url, relativePath]: string[] = chunk
            .toString()
            .split(",");

          const objectRelativePath: ParsedPath = path.parse(relativePath);
          const { dir, name } = objectRelativePath;

          objectRelativePath.dir = `${dir ? dir.concat("/") : ""}${
            !defaults[name] ? name : ""
          }`.trim();
          objectRelativePath.base =
            defaults[name] === "404" ? "404.html" : "index.html";

          const urlComplet: string = path.resolve(
            rootPages,
            path.format(objectRelativePath)
          );

          const TransformContent = new Transform({
            write(chunk, _encoding, cb) {
              const dataUrl: DataPage = get(url);
              let content: string = "";
              try {
                content = ejs.render(chunk.toString(), dataUrl, {
                  filename: relativePath,
                });
              } catch (err) {
                handleError(err, "pages");
                return cb();
              }

              const Lines: string[] = SplitInLines(content);
              const LinksAndStrings: LineProcessed[] = MapLines(
                Lines,
                /<link/g
              );
              const ScriptsAndStrings: LineProcessed[] = MapLines(
                Lines,
                /<script/g
              );

              const status: StatusLine = {
                NoLinksNoScripts: Boolean(
                  !LinksAndStrings.length && !ScriptsAndStrings.length
                ),
                LinksAndScripts: Boolean(
                  LinksAndStrings.length && ScriptsAndStrings.length
                ),
                OnlyLinks: Boolean(
                  LinksAndStrings.length && !ScriptsAndStrings.length
                ),
                OnlyScripts: Boolean(
                  !LinksAndStrings.length && ScriptsAndStrings.length
                ),
              };

              const {
                NoLinksNoScripts,
                LinksAndScripts,
                OnlyLinks,
                OnlyScripts,
              } = status;

              if (NoLinksNoScripts) {
                const contentHTML: Buffer = minifyHtml.minify(content, cfg);
                this.push(contentHTML);
                return cb();
              }
              if (OnlyLinks) {
                return ProcessCSS.call(this, LinksAndStrings, content, cfg, cb);
              }
              if (OnlyScripts) {
                ProcessJS(ScriptsAndStrings, (scriptString, newScript) => {
                  content = content.replace(scriptString, newScript);
                }).then(() => {
                  const contentHTML: Buffer = minifyHtml.minify(content, cfg);
                  this.push(contentHTML);
                  cb();
                });
                return;
              }
              if (LinksAndScripts) {
                ProcessJS(ScriptsAndStrings, (scriptString, newScript) => {
                  content = content.replace(scriptString, newScript);
                }).then(() =>
                  ProcessCSS.call(
                    this,
                    LinksAndStrings,
                    content,
                    cfg,
                    config,
                    cb
                  )
                );
              }
            },
          });

          const ReadFileStream: ReadStream = createReadStream(absolutePath);
          const dirname: string = path.dirname(urlComplet);

          if (!existsSync(dirname)) {
            mkdir(
              dirname,
              {
                recursive: true,
              },
              () => {
                const WriteFileStream: WriteStream =
                  createWriteStream(urlComplet);
                ReadFileStream.on("end", () => {
                  config.spinner.text = `${chalk`Reading file ${relativePath} -> Url: {hex('#AED6F1') ${url}}`}|Reading file ${relativePath} -> Url: ${url}`;
                  if (maxIndex && maxIndex - 1 === index) {
                    this.end(res);
                  }
                  index++;
                })
                  .pipe(TransformContent)
                  .pipe(WriteFileStream);
                cb();
              }
            );
          } else {
            const WriteFileStream: WriteStream = createWriteStream(urlComplet);
            ReadFileStream.on("end", () => {
              config.spinner.text = `${chalk`Reading file ${relativePath} -> Url: {hex('#AED6F1') ${url}}`}|Reading file ${relativePath} -> Url: ${url}`;
              if (maxIndex && maxIndex - 1 === index) {
                this.end(res);
              }
              index++;
            })
              .pipe(TransformContent)
              .pipe(WriteFileStream);
            cb();
          }
        },
      });

      RouterStream.on("end", () => {
        config.spinner.info.add(
          chalk`Found {hex("#4BBAFF") (${routes.size})} pages in directory ${config["#pagesRoot"]}`
        );
        maxIndex = routes.size;
      });

      RouterStream.pipe(WriteStreamContent);
    });
  });
}
