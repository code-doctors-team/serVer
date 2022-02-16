<h1 align='center'> SerVer <img align='center' src='https://i.postimg.cc/25XSjsLP/logo-sv.png' width="60" /></h1>

- Fast mode development and build for production!
- Make in typescript! :D
- Use ejs(future more templates) templates for pages and components!

### Table of Contents

- [How get?][1]
- [Sv-cli][2]
  - [¿How use sv-cli?][3]
  - [¿How use sv-cli in mode dev?][4]
  - [¿How use plugins in sv-cli?][5]
- [Concepts basics][6]
  - [Structure your directorys][7]
  - [Routes][8]
- [Config Files][9]
  - [File config.data.js][10]
- [How to build my project for production?][11]
- [How can I test my project in production?][12]

## How get?

Run:

```sh
  npm install @sv-core/core -D
```

## Sv-cli

Use serVer cli.

### ¿How use sv-cli?

```sh
$ sv help
Usage: sv [options] [command]

Options:
  -v, --version    sv version
  -h, --help       display help for command

Commands:
  dev [options]    Starting your proyect in mode development
  build [options]  Starting build of your project for production
  start [options]  Start your application for production
  help [command]   display help for command
```

### ¿How use sv-cli in mode dev?

In dev(development) mode, it comes by default, these are the commands in this mode.

```sh
  $ sv dev -h
  Usage: sv dev [options]

  Starting your proyect in mode development

  Options:
    --root <root>                         Select root of pwd (default: ".")
    --open [open_browser]                 Open browser(Select Edge, Firefox, Opera(If you use opera GX  it will automatically open it) or Chrome) (default: false)
    -p,--port <port_number>               This is the port where you will work in development mode (default: "5000")
    --pages <pages_root>                  Select root of pages (default: "./pages")
    --styles <styles_root>                Select root of styles(css) (default: "./src/styles")
    --assets <assets_root>                Select root of assets(images and manifest.json) (default: "./src/assets")
    --scripts <scripts_root>              Select root of javascript(js) (default: "./src/scripts")
    --only-reload [specific_only_reload]  Specific only-reload, in css, html(Specific true, all will use strategy only-reload)) (default: false)
    -h, --help                            display help for command
```

## Concepts basics

There is a concepts basics for use serVer

### Structure your directorys

serVer use a structure for your pages, styles, javascripts and assets.

Use a structure similar to this.

      📦src
      ┣ 📂assets
      ┃ ┣ manifest.json
      ┃ ┗ 📜logo.jpg
      ┣ 📂components
      ┃ ┗ 📜header.ejs
      ┣ 📂styles
      ┃ ┣ 📜styles.css
      ┣ 📂js
      ┃ ┣ 📜index.js
      ┣ 📂pages
      ┃ ┣ 📂dashboard
      ┃ ┃ ┗ 📜settings.ejs
      ┃ ┣ 📜index.ejs

### Routes

SerVer has a **file-system** based router built on the concept of pages.

When added a file `.ejs` in the carpet pages, automatically available as a route.

<h3>Index</h3>

<p>

The router will automatically routes files named index to the root of the directory `pages`.

- `pages/index.ejs` → `/`
- `pages/blog/index.ejs` → `/blog`

</p>

<h3>Nested routes</h3>

<p>

These routes are generated when you create a subfolder within a folder, this in the directory `pages`.

- `pages/user/profile.ejs`--> `/user/profile`
- `pages/posts/html.ejs`--> `/posts/html`

</p>

## Config Files

### File config.data.js

This is a file where you can add variables to your ejs files.

Create a file named `config.data.js`

Accept **module/exports Ecmascript 6+** and **CommonJS**

### Squemas:

<h4>With commonJS</h4>

```typescript
  exports.[page] = {
    ['/[subPage]']: {
      ['/[subPage]']: {
        // ...
        [variable: (string | number)]: // Function, string, object, any
      }
      [variable: (string | number)]: // Function, string, object, any
    }
    [variable: (string | number)]: // Function, string, object, any
  }
  export.["notFound"] = {
    [variable: (string | number)]: // Function, string, object, any
  } -> `Data for 404 page`
```

<h4>With module/exports Ecmascript 6+</h4>

```typescript
  export const [page] = {
    ['/[subPage]']: {
      ['/[subPage]']: {
        // ...
        [variable: (string | number)]: // Function, string, object, any
      }
      [variable: (string | number)]: // Function, string, object, any
    }
    [variable: (string | number)]: // Function, string, object, any
  }
  export const notFound = {
    [variable: (string | number)]: // Function, string, object, any
  } -> `Data for 404 page`
```

### Examples

```javascript
// This variable is available on the index page
export const index = {
  title: "First Proyect with serVer",
};

// With commonJs
exports.index = {
  title: "First Proyect with serVer",
};
```

## How to build my project for production?

Is simple, only run this command once.

```sh
  sv build
```

For look options:

```sh
$ sv build -h
  Usage: sv build [options]

  Starting build of your project for production

  Options:
    --root <root>                         Select root of pwd (default: ".")
    --dist <dist_proyect>     Is a place where will bundle of your project (default: "public")
    --pages <pages_root>      Select root of pages (default: "./pages")
    --styles <styles_root>    Select root of styles(css) (default: "./src/styles")
    --assets <assets_root>    Select root of assets(images and manifest.json) (default: "./src/assets")
    --scripts <scripts_root>  Select root of javascript(js) (default: "./src/scripts")
    --clear                   Delete the bundle folder before the initialization of the "build"   processes (default: false)
    --info                    Show more information about build process (default: false)
    -h, --help                display help for command
```

After of run this command, creates a carpet of your application's bundle.

## How can I test my project in production?

We can test the project in production, with this simple command.

```sh
  sv start
```

You can change the port with flag `--port` and change your directory build with flag `--dist`

[1]: #how-get
[2]: #sv-cli
[3]: #¿how-use-sv-cli
[4]: #¿how-use-sv-cli-in-mode-dev
[5]: #¿how-use-plugins-in-sv-cli
[6]: #concepts-basics
[7]: #structure-your-directorys
[8]: #routes
[9]: #config-files
[10]: #file-configdatajs
[11]: #how-to-build-my-project-for-production
[12]: #how-can-i-test-my-project-in-production
