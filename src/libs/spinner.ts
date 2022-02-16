import Spinner from '@sv-cd/cli-loader';
import chalk from 'chalk';

let instance: Spinner | null = null;

export default function spinner(nameProyect?: string): Spinner {
  if(!instance) instance = new Spinner({ text: 'Iniciando server...', prefixText: {
    value: chalk`{blue {bold [${nameProyect}]}}`,
    message: `[${nameProyect}]`,
  }});
  return instance;
};



