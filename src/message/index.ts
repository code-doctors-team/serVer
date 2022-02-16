import boxen from "boxen";
import chalk from "chalk";

export default function message(externalUrl: string, url: string): string {
  const messageBoxen: string = boxen(chalk`{hex('#3085FF') {bold URLs:\nLocal: ${url}${externalUrl ? chalk`\nExternal: ${externalUrl}` : ''}}}`, {
    borderColor: 'blue',
    padding: 1,
  });
  return messageBoxen;
}