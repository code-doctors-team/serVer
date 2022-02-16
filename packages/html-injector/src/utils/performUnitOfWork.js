import filterChildren from "./filterChildren";
import reconcileChildren from "./reconcileChildren";

export default function performUnitOfWork(fiber) {
  const { children, ...props } = fiber.props;
  const newChildren = children.filter(filterChildren);
  Reflect.set(fiber, 'props', props) 
  reconcileChildren(fiber, newChildren);
  if(fiber.child) return fiber.child;
  let nextFiber = fiber;
  while(nextFiber) {
    if(nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}