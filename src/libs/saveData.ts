import fs from 'fs';
import path from 'path';

type SaveDataOperations = 'add' | 'get';

export default function saveData(data: any, type: SaveDataOperations = 'add', cb?: (err: null | Error, content: string) => void) {
  const pathData: string = path.resolve(__dirname, './sv@data');
  const operations = {
    add: () => {
      const saveDataRead = fs.createWriteStream(pathData);
      saveDataRead.write(data);
    },
    get: (cb: (err: Error, content: string) => void) => {
      let content: string = '';
      try {
        const saveDataRead = fs.createReadStream(pathData, 'utf-8');
        saveDataRead.on('data', (newContent: string) => content += newContent);
        saveDataRead.on('end', () => cb(null, content));
      }catch(err) {
        cb(err, content);
      }
    }
  };
  const operation: (cb?: (err: null | Error, content: string) => void) => void | Object = operations[type];
  if(operations) {
    operation(cb);
  }
}