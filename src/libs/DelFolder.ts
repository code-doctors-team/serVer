import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { configType } from '../config';
import logger from './logger';

export default async function DelFolder(config: configType): Promise<void> {
  const { dist: dirPath } = config;
  if(existsSync(dirPath)) {
    const configRm = {
      recursive: true,
      force: true,
    };
    logger.logString`Deleting {hex('#FF2E51') [${config['#dist']}]} folder`;
    return rm(dirPath, configRm)
  }
}