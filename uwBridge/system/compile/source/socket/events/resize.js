import app from '../app';
const {
  utility: {
    debounce,
    eventAdd,
    isAgent,
    info,
    model
  },
  view
} = app;
const updateResize = debounce(() => {
  app.view.set('bodyHeight', info.bodyHeight);
  app.view.set('bodyWidth', info.bodyWidth);
  app.view.set('windowHeight', info.windowHeight);
  app.view.set('windowWidth', info.windowWidth);
  const width = info.windowWidth;
  let screenSize;
  if (isAgent.mobile) {
    screenSize = 'mobileScreen';
  } else if (width < 1024) {
    screenSize = 'smallScreen';
  } else if (width < 1920) {
    screenSize = 'mediumScreen';
  } else if (width < 3000) {
    screenSize = 'hdScreen';
  } else if (width > 3000) {
    screenSize = '4kScreen';
  }
  console.log(screenSize);
  app.view.set('screenSize', screenSize);
}, 250);
eventAdd(window, 'resize', () => {
  requestAnimationFrame(updateResize);
}, true);
updateResize();
const smoothScroll = (element, to, duration) => {
  if (duration <= 0) {
    return;
  }
  const difference = to - element.scrollTop;
  const perTick = difference / duration * 10;
  requestAnimationFrame(() => {
    element.scrollTop = element.scrollTop + perTick;
    if (element.scrollTop === to) {
      return;
    }
    smoothScroll(element, to, duration - 10);
  });
};
model('smoothScroll', smoothScroll);
