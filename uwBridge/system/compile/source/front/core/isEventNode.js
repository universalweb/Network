import app from './app.js';
export const isEventNode = (componentEvent) => {
  if (!componentEvent || !componentEvent.original || !componentEvent.original.target) {
    return false;
  }
  return componentEvent.node === componentEvent.original.target;
};
app.isEventNode = isEventNode;
