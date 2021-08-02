import app from '../app';
const {
  isEventNode,
  utility: {
    isEnter,
  }
} = app;
const preventDefault = function(callable) {
  return function(componentEvent, ...args) {
    if (componentEvent) {
      if (componentEvent.node && !isEventNode(componentEvent)) {
        componentEvent.notTarget = true;
      } else {
        componentEvent.isTarget = true;
      }
      const original = componentEvent.original;
      componentEvent.isEnter = (original && original.keyCode) ? isEnter(original) : true;
    }
    componentEvent.source = componentEvent.ractive;
    callable(componentEvent, ...args);
    return false;
  };
};
export default preventDefault;
