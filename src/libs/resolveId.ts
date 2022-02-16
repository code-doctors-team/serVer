import resolve from 'resolve/sync';

const moduleDirectories = ['web_modules', 'node_modules'];

export default function resolveId(base: string, id: string): string {
  const resolveOpts = {
    basedir: base,
    moduleDirectory: moduleDirectories.concat(),
    paths: [],
    extensions: ['.css'],
    packageFilter(pkg) {
      if (pkg.style) Reflect.set(pkg, 'main', pkg.style);
      else if (!pkg.main || !/\.css$/.test(pkg.main)) Reflect.set(pkg, 'main', 'index.css');
      return pkg;
    },
    preserveSymlinks: false,
  };
  return resolve(id, resolveOpts)
}