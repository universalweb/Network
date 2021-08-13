(async () => {
  const {
    component,
    utility: {
      cnsl
    }
  } = app;
  cnsl('menubar Component', 'notify');
  await component('menubar', {
    asset: {
      template: `${exports.dirname}template`,
      css: [`${exports.dirname}style`]
    }
  });
})();
