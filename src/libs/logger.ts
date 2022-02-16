import chalk from "chalk";
import spinner from "./spinner";

const logger = {
  log: (...messages: (string|string[])[]) => { 
    messages.forEach(message => {
      const { prefixText } = spinner();
      console.log(`${prefixText.value} ${chalk(message)}`);
    })
  },
  logString: (...args) => {
    const { prefixText } = spinner();
    console.log(`${prefixText.value} ${chalk(...args)}`);
  },
  warn: (...messages: string[]) => { 
    messages.forEach(message => {
      const { prefixText } = spinner();
      console.log(chalk`${prefixText.value} {bgHex("#FFFB26") {bold {hex("#0000") WARNING}}} ${message}`);
    })
  },
  warnString: (...args) => {
    const { prefixText } = spinner();
    console.log(chalk`${prefixText.value} {bgHex("#FFFB26") {bold {hex("#0000") WARNING}}} ${chalk(...args)}`);
  },
  error: (...messages: string[]) => {
    messages.forEach(message => {
      const { prefixText } = spinner();
      console.log(chalk`{red {bold {italic ${prefixText.message}}}} ${message}`);
    })
  },
  errorString: (...args) => {
    const { prefixText } = spinner();
    console.log(chalk`{red {bold {italic ${prefixText.message}}}} ${chalk(...args)}`);
  },
  chalk: chalk,
};

export default logger;