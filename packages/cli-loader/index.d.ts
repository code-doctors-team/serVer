import readline from 'readline';

export default class Spinner {
  constructor({ text, custom, spinner, prefixText }: {
    text?: string,
    custom?: Object,
    spinner?: string, 
    prefixText?: {
      value: string,
      message?: string,
    },
  });

  errors: Set<string>
  info: Set<string>
  private ['@text']: string;
  custom: Object;
  spinner: string;
  color: string;
	prefixText: {
    value: string,
    message?: string,
  };
  private i: number;

  spinners: () => Object;
  
  start: (text: string) => void;
  
  set text(newText: string);

  setError: (newText: string) => void;

  get text();

  setTextPromise(newText: string): Promise<void>

  stop: (messageStop: string) => void;
}

export declare const rdl: typeof readline;
export {};