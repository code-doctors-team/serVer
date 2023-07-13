import { resolve } from "path";
import crypto from "node:crypto";
import { getEventListeners } from "node:events";
import { readFileSync, existsSync } from "fs";
import { check } from "tcp-port-used";
import { WebSocketServer } from "ws";
import { watch } from "chokidar";
import ip from "ip";
import internetAvailable from "internet-available";

let isOnline = true;
let numbersOfTest = 1;

async function getNextPort(port) {
  try {
    if (numbersOfTest === 1) {
      this.spinner.text = "Verifying your internet...";
      await internetAvailable();
    }
    const isUse = await check(port, "127.0.0.1");
    this.spinner.text = `Verifying port ${port} (${numbersOfTest} atempts)`;
    if (!isUse) {
      this.spinner.text = `Verify port ${port} (✅)`;
      return port;
    }
    port++;
    numbersOfTest++;
    return await getNextPort(port);
  } catch (err) {
    this.spinner.text = `There isn't internet,  mode offline active`;
    isOnline = false;
    return port;
  }
}

export default class ServerReload {
  constructor(emitter) {
    this.emitter = emitter;
  }
  #svWs = new Map();
  initPlugins = (plugins, { version, sv }) => {
    this.plugins = plugins;
    const injectPlugins = plugins.map(({ inject }) => inject);
    const baseClients = readFileSync(
      existsSync(resolve(__dirname, "./clients.js"))
        ? resolve(__dirname, "./clients.js")
        : resolve(__dirname, "./clients/index.js"),
      "utf-8"
    );
    let inject = baseClients;
    injectPlugins.forEach((injectPlugin) => {
      inject += injectPlugin;
    });
    sv.use(`/sv@${version}`, (_, res) => {
      res.set("Content-Type", "application/javascript; charset=UTF-8");
      res.send(inject);
    });
  };
  getSnippet(version) {
    const ids = [crypto.randomUUID()];
    const plugins = this.plugins?.filter((plugin) => !!plugin.script);
    for (let i = 0; i < plugins?.length; i++) ids.push(crypto.randomUUID());

    let snippet = `<script id="${ids.at(0)}" sv-version="${version}">
    const getUrl = () => [location.protocol, '//', location.host, '/', 'sv@${version}'].join('');
    const script = document.createElement('script');
    script.setAttribute('src', getUrl());
    script.setAttribute('sv-script', true);
    script.setAttribute('sv-version', "${version}");
    window.__ids_script_sv__ = ${JSON.stringify(ids)};
    document.head.append(script);
    script.addEventListener('load', () => {
      const oldScript = document.querySelector('script[id="${ids.at(0)}"]');
      oldScript.remove();
    })</script>`;
    plugins?.forEach((plugin, i) => {
      snippet += `<script id="${ids.at(i + 1)}">
        ${plugin.script}
        const oldScript = document.querySelector('script[id="${ids.at(
          i + 1
        )}"]');
          oldScript.remove();</script>`;
    });
    return snippet;
  }
  init = ({ server, port, version, plugins, spinner }, cb) => {
    if (!server) {
      throw Error("Option server is required");
    }
    this.version = version;
    const sv = server(WebSocketServer);
    this.initPlugins(plugins, {
      sv,
      version,
    });
    const { socket: wss, listen } = sv;
    Reflect.set(this, "wss", wss);
    Reflect.set(this, "spinner", spinner);
    getNextPort
      .call(this, port)
      .then((port) => ({
        ip: ip.address(),
        port,
      }))
      .then(({ port, ip }) =>
        listen(port, () =>
          cb({
            url: `http://localhost:${port}`,
            urlExternal: isOnline ? `http://${ip}:${port}` : "",
            snippet: this.getSnippet(version),
          })
        )
      );
    wss.on("connection", (ws, req) => {
      this.req = req;
      this.plugins?.forEach((plugin) => {
        this.emitPlugin(plugin, {
          emit: this.emit,
          on: this.on,
          req: req,
          type: "connection",
        });
      });
      ws.on("message", this.messageHandle);
      Reflect.set(this, "ws", ws);
    });
    return Object.assign(this, sv);
  };
  messageHandle = (messageData) => {
    const { type, data } = JSON.parse(messageData);
    if (this.#svWs.has(type)) {
      const fns = this.#svWs.get(type);
      fns.forEach((fn) => fn(...data));
    }
    const plugins = this.plugins.filter(
      (plugin) => !!getEventListeners(plugin, type).length
    );
    if (plugins.length) plugins.forEach((plugin) => plugin.emit(type, ...data));
  };
  watch = watch;

  reload = (pth, type, aditionalData) => {
    const plugins = this.plugins.filter(({ name }) => name === type);
    if (plugins.length) {
      const [plugin] = plugins;
      if (plugins.length > 1) {
        throw Error(
          `Error in attribute plugin, add more 1 time a plugin named ${plugin.name}`
        );
      }
      this.emitPlugin(plugin, {
        ...aditionalData,
        path: pth,
        emit: this.emit,
        on: this.on,
        type: "change",
        req: this.req,
      });
      return;
    }
    this.emit("reload:sv");
  };

  emitPlugin = (plugin, data) => {
    plugin.emit(plugin.name, data);
  };
  emit = (type, ...data) => {
    const dt = JSON.stringify({
      type: type,
      data: data,
    });
    if (this.ws) {
      this.wss.clients.forEach((client) => {
        client.send(dt);
      });
    }
  };
  on = (type, fn) => {
    const isEventListened = this.#svWs.has(type);
    if (isEventListened)
      return this.#svWs.set(type, [...this.#svWs.get(type), fn]);
    this.#svWs.set(type, [fn]);
  };
}
