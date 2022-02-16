import { nodesCreated } from "./find";

export const handleClearDomKeys = () => {
  if(nodesCreated.size) {
    nodesCreated.clear();
  }
}

export default function handleExit() {
  console.log('Finish')
}