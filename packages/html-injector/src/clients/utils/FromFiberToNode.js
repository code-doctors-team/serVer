import setAttributes from "./setAttributes";

export default function FromFiberToNode(fiber) {
  if (!fiber) return;

  const newElement =
    fiber.tag === "text"
      ? fiber.props.nodeValue
      : document.createElement(fiber.tag);

  if (fiber.tag !== "text") {
    setAttributes(fiber.props, newElement);
  }
  return newElement;
}
