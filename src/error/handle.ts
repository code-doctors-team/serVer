import { Location } from "@parcel/css";
import { PartialMessage } from "esbuild";
import path from "path";
import config from "../config";
import logger from "../libs/logger";

type ErrorParam = Error & NodeJS.ErrnoException & {
  errors?: PartialMessage[],
  fileName?: string,
  source?: string,
  loc?: Location,
};

interface HandlesError {
  waitingReady: Set<string>,
  data: () => void;
  css: () => void;
  js: () => void;
  pages: () => void;
  assets: () => void;
};

function onReady(first: boolean) {
  if(first) {
    config.events.on('ready', () => {
      this.waitingReady.forEach((message: string) => {
        logger.error(message);
      })
    })
    first = false;
  }
};

const convertAbsoluteToRelativeFilename = (filename: string): string => path.relative(config.cssRoot, filename);

export const handleError = (err: ErrorParam, type?: string) => {
  let first = true;
  const handles: HandlesError = {
    waitingReady: new Set(),
    data() {
      const messageError: string = logger.chalk`${err.message} {hex("#4BCDFF") (\`config.data.js\`)}`;
      if(config.ready) {
        logger.error(messageError);
      } else {
        this.waitingReady.add(messageError);
        config.spinner.setError(messageError);
      }
    },
    css() {
      let messageError: string = err.message;
      if(err.loc) {
        const name: string = convertAbsoluteToRelativeFilename(err.fileName);
        messageError = logger.chalk`Error in ${name}: {hex("#26DDFF") {bold [Line: ${err.loc.line}, Columns: ${err.loc.column}]} {hex("#FFB04B") {italic (Message: ${err.message})}}}\nSource: \`${err.source}\``;
      }
      if(config.ready) {
        logger.error(messageError);
      } else {
        this.waitingReady.add(messageError);
        config.spinner.setError(messageError);
      }
    },
    js() {
      let messageError: string = err.message;
      const { errors } = err;
      // console.log(err)
      if(!errors || !errors.length) {
        if(config.ready) {
          logger.error(messageError);
        } else {
          this.waitingReady.add(messageError);
          config.spinner.setError(messageError);
        }
        return;
      }
      errors.forEach((error: PartialMessage) => {
        const { file: name } = error.location;
        messageError = logger.chalk`Error in ${name}: {hex("#26DDFF") {bold [Line: ${error.location.line}, Columns: ${error.location.column}]} {hex("#FFB04B") {italic (Message: ${error.text})}}}\nSource: \`${error.location.lineText}\``;
        if(config.ready) {
          logger.error(messageError);
        } else {
          this.waitingReady.add(messageError);
          config.spinner.setError(messageError);
        }
      }) 
    },
    pages() {
      let messageError = err.message;
      if(config.ready) {
        logger.error(messageError);
      } else {
        this.waitingReady.add(err);
        config.spinner.setError(messageError);
      }
    },
    assets() {
      let messageError = err.message;
      if(config.ready) {
        logger.error(messageError);
      } else {
        this.waitingReady.add(messageError);
        config.spinner.setError(messageError);
      }
    }
  }
  const handle = handles[type || 'default'];
  if(first) onReady.call(handles, first);
  if(handle) handle.call(handles);
}