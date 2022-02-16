const getUrl = () => [location.protocol === 'http:' ? 'ws:' : 'wss:', '//', location.host, location.pathname, location.search].join('');

const ws = new WebSocket(getUrl());
let isOpen = false;
const waitingEmit = [];
const io = {
  data: new Map(),
  on(type, fn) {
    const isEventListened = this.data.has(type);
    if(isEventListened) return this.data.set(type, [...this.data.get(type), fn]);
    this.data.set(type, [fn]);
  },
  emit(type, ...data) {
    const dt = JSON.stringify({
      type,
      data: data,
    });
    if(isOpen) {
      return ws.send(dt);
    }
    waitingEmit.push(dt);
  }
};
window.__ioSv__ = io;

ws.addEventListener('open', () => {
  isOpen = true;
  waitingEmit.forEach(dt => ws.send(dt));
});

ws.addEventListener('message', ({ data }) => {
  const { type, data: newData } = JSON.parse(data);
  const newDataParsed = newData.map((dataSolid) => {
    let newDataSolidParsed = null;
    try {
      // debugger;
      if(typeof dataSolid === 'string') {
        newDataSolidParsed = JSON.parse(dataSolid);
      }
    } catch(err) {
      newDataSolidParsed = dataSolid;
    }
    return newDataSolidParsed;
  })
  if(io.data.has(type)) {
    const fns = io.data.get(type);
    fns.forEach(fn => fn(...newDataParsed))
  };
});

io.on('reload:sv', () => location.reload(true));