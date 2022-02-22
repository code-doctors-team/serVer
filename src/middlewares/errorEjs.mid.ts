import ejs from 'ejs';
import { NextFunction, Request, Response } from 'express';
import { createReadStream, ReadStream } from 'fs';
import path from 'path';
import { Transform } from 'stream';
import { handleError } from '../error/handle';
import { snippetSv } from '../libs/dev';

const getStack = (error: Error): string => {
  const { stack } = error;
  let init: string = '';
  const ErrorLine: string = stack
    .split('\n')
    .find((Line: string) => {
      if(Line.startsWith('SyntaxError')) {
        init = 'SyntaxError';
      } else if(Line.startsWith('ReferenceError')) {
        init = 'ReferenceError';
      } else if(Line.startsWith('Error')) {
        init = 'Error';
      }
      return Line.startsWith('SyntaxError') || Line.startsWith('ReferenceError') || Line.startsWith('Error');
    });
  if(!ErrorLine) return stack;
  const ErrorLineInitBr: string = ErrorLine.replace(init, `<b>${init}`);
  const ErrorLineFinishBr: string = ErrorLineInitBr
                                      .slice(0, -1)
                                      .concat(`${ErrorLineInitBr[ErrorLineInitBr.length - 1]} </b>`);
  const resolveStack: string = stack.replace(ErrorLine, ErrorLineFinishBr);
  return resolveStack;
};

export default function errorEjsMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction) {
  handleError(err);
  const streamTemplate: ReadStream = createReadStream(path.resolve(__dirname, '../templates/error_ejs.ejs'));
  const transformTemplate: Transform = new Transform({
    write(chunk, _encoding, cb) {
      const stack: string = getStack(err);
      let content: string = ejs.render(chunk.toString(), {
        stack,
        template: 'ejs',
      });
      if(content.includes('</head>')) {
        content = content.replace('</head>', snippetSv.concat('</head>'));
      } else if(content.includes('</body>')) {
        content = content.replace('</body>', snippetSv.concat('</body>'));
      } else if(content) {
        content = content.concat(snippetSv);
      }
      this.push(content);
      cb();
    }
  })
  streamTemplate.pipe(transformTemplate).pipe(res);
}
