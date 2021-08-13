(async () => {
  const {
    component,
    utility: {
      cnsl
    }
  } = app;
  cnsl('inputGroup Component', 'notify');
  await component('inputGroup', {
    asset: {
      template: `${exports.dirname}template`
    }
  });
})();
