import server from '@sv-cd/server';
import serveStatic from 'serve-static';
import { Request, Response } from 'express';
import config from "../config";
import message from '../message';
import Router from '../router';
import { createReadStream } from 'fs';

type OptionsProduction = {
  open?: boolean,
  port: string,
};


export default function prod(options: OptionsProduction) {
  const pages = new Router(config);
  const { dist } = config;
  const sv = server();
  sv.use(serveStatic(dist));
  sv.use((_: Request, res: Response) => {
    pages.add404();
    const page = pages.get('/404');
    const ReadStreamFile = createReadStream(page.absolutePath, 'utf-8');
    ReadStreamFile.pipe(res);
  })
  sv.listen(Number(options.port), () => {
    config.spinner.stop(`Ready! You can look your application in production.\n`)
    console.log(message(null, `http://localhost:${options.port}`));
  })
}