import * as glob from "fast-glob";
import path, { ParsedPath } from "path";
import { Transform } from "stream";
import { configType } from "../config";
import { handleError } from "../error/handle";

type Route = {
  url: string;
  absolutePath: string;
  relativePath?: string;
  root?: string;
};

export default class Router {
  routes: Map<string, Route>;
  config: configType;
  callback: (this: Router, routes: Map<string, Route>) => void;
  private TransformPage: Transform;

  constructor(config: configType) {
    this.routes = new Map();
    this.config = config;
  }

  #loadedRoutes = false;

  public get = (url: string): Route | null => this.routes.get(url) || null;

  public getRoot = (root: string): Route | null => {
    let routeRoot = null;
    this.routes.forEach((value) => {
      if (routeRoot) return;
      if (value.root === root) routeRoot = value;
    });
    return routeRoot;
  };

  public has = (url: string, createUrl: boolean = true): boolean =>
    this.routes.has(createUrl ? Router.createUrl(url) : url);

  public delete = (url: string, createUrl: boolean = true): boolean =>
    this.routes.delete(createUrl ? Router.createUrl(url) : url);

  public add404 = () => {
    const url = "/404";
    const actions: {
      [action: string]: () => void;
    } = {
      dev: () => {
        const path404_dev: string = path.resolve(
          __dirname,
          "../templates/404_dev.ejs"
        );
        this.routes.set(url, {
          url,
          absolutePath: path404_dev,
        });
        if (this.TransformPage) {
          this.TransformPage.push([path404_dev, url, "./404.ejs"].join(","));
        }
      },
      build: () => {
        const path404_build: string = path.resolve(
          __dirname,
          "../templates/404_prod.ejs"
        );
        this.routes.set(url, {
          url,
          absolutePath: path404_build,
        });
        if (this.TransformPage) {
          this.TransformPage.push([path404_build, url, "./404.ejs"].join(","));
        }
      },
      start: () => {
        if (!this.#loadedRoutes) {
          const path404 = path.resolve(this.config.dist, "404.html");
          this.routes.set(url, {
            url,
            absolutePath: path404,
          });
        }
      },
    };

    if (!this.has(url, false)) {
      const action = actions[this.config.type];
      action();
    }
  };

  private static prelimConfig = {
    index: "/",
  };

  static createUrl = (fileObject: ParsedPath | string): string => {
    let fileOrFileObject: ParsedPath | string = fileObject;
    if (typeof fileOrFileObject === "string") {
      fileOrFileObject = path.parse(fileOrFileObject);
    }
    const { name, dir } = fileOrFileObject;
    let url: string = Router.prelimConfig[name] ?? "/".concat(name);
    if (dir) url !== "/" ? (url = dir.concat(url)) : (url = dir);
    if (url[0] !== "/") url = "/".concat(url);
    return url;
  };

  public loadTemplateRoute = (
    url: string,
    template: string,
    parentUrl: string
  ): Route => {
    const [parent, type]: [Route, string] = [
      this.get(parentUrl) || this.getRoot(parentUrl),
      this.get(parentUrl) ? "page" : "root",
    ];
    if (parent) {
      if (type === "root") {
        const absolutePathRoot: string = path.resolve(
          this.config.pagesRoot,
          parent.root.slice(1)
        );
        const urlTemplate: string = Router.createUrl(
          path.join(parent.root.slice(1), url)
        );
        const id: string = template.slice(1);
        const templateFile: string = path
          .resolve(absolutePathRoot, `[${id}]`)
          .concat(this.config.extname);
        const route: Route = {
          url: urlTemplate,
          absolutePath: templateFile,
          root: parent.url,
        };
        this.routes.set(urlTemplate, route);
        return route;
      }
      const urlTemplate: string = Router.createUrl(
        path.join(parent.url.slice(1), url)
      );
      if (path.extname(parent.absolutePath) === this.config.extname) {
        handleError(
          Error(
            `If you use sv templates, ${
              parent.relativePath
            } must be a folder and have the \`${template.concat(
              this.config.extname
            )}\` file inside it.`
          ),
          "pages"
        );
        return;
      }
      const id = template.slice(1);
      const templateFile: string = path
        .resolve(parent.absolutePath, `[${id}]`)
        .concat(this.config.extname);
      const route: Route = {
        url: urlTemplate,
        absolutePath: templateFile,
        root: parent.url,
      };
      this.routes.set(urlTemplate, route);
      return route;
    }
    return null;
  };
  public loadRoute = (file: string): Route => {
    const { pagesRoot } = this.config;
    const fileObject: ParsedPath = path.parse(file);
    Reflect.set(fileObject, "root", pagesRoot.concat("/"));
    const url = Router.createUrl(fileObject);

    if (this.config.type === "dev") {
      this.config.spinner.text = `Loading routes -- Load ${fileObject.name}.ejs --> ${url}`;
    }
    const route: Route = {
      url,
      absolutePath: fileObject.dir
        ? path.join(pagesRoot.concat("/"), path.format(fileObject))
        : path.format(fileObject),
      relativePath: file,
      root: Router.createUrl(fileObject.dir),
    };
    this.routes.set(url, route);
    return route;
  };

  public loadRoutes = (
    callback: (this: Router, routes: Map<string, Route>) => void
  ): void => {
    this.#loadedRoutes = true;
    this.callback = callback.bind(this, this.routes);
    const { pagesRoot } = this.config;
    if (this.config.type === "dev") {
      this.config.spinner.text = `Loading routes -- Folder ${path.basename(
        pagesRoot
      )}`;
    }
    this.stream.on("finish", () => {
      if (this.config.type === "dev") {
        this.config.spinner.text = `Loading routes -- Folder ${path.basename(
          pagesRoot
        )}`;
      }
      this.callback(null);
    });
  };
  get stream() {
    const { pagesRoot } = this.config;
    const pages: NodeJS.ReadableStream = glob.stream("./**/*.ejs", {
      cwd: pagesRoot,
    });
    const loadRoute = this.loadRoute.bind(this);
    this.TransformPage = new Transform({
      write(chunk, encoding, cb) {
        const { absolutePath, url, relativePath } = loadRoute(chunk.toString());
        this.push([absolutePath, url, relativePath].join(","));
        cb();
      },
    });
    this.add404();
    return pages.pipe(this.TransformPage);
  }
}
