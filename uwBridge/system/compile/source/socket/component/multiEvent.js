import app from '../app';
const {
  utility: {
    each,
  }
} = app;
const multiEvent = (view, componentEvent, ...events) => {
  each(events, (item) => {
    if (item) {
      each(item.split(','), (subItem) => {
        view.fire(subItem.trim(), componentEvent);
      });
    }
  });
};
export default multiEvent;
