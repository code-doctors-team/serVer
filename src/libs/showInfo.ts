import { configType } from "../config";
import logger from "./logger";

export default function showInfo(config: configType) {
  let init = false;
  const messageAddSpaces = (message: string) => logger.chalk`{yellow {bold [Info]}} ${message}`;
  config.spinner.info.forEach(info => {
    if(!init) {
      logger.logString`{hex('#6AFF4B') {italic Info Extra:}}`;  
      init = true;
    }
    if(info.startsWith('Reading')) {
      console.log(messageAddSpaces(info.replace('Reading', 'Readed')))
      return;
    }
    if(info === 'Data upload finished') {
      console.log(messageAddSpaces(`Data loaded from config.data.js`))
      return;
    }
    console.log(messageAddSpaces(info))
  })
}