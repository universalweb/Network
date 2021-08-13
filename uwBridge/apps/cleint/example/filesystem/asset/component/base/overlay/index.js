(async () => {
  const {
    component,
    utility: {
      cnsl
    }
  } = app;
  cnsl('Overlay Component', 'notify');
  await component('overlay', {
    asset: {
      template: `${exports.dirname}template`,
      css: [`${exports.dirname}style`]
    },
    onrender({
      source
    }) {
      source.on({
        open() {
          source.set('options.hide', false);
        },
        close() {
          source.set('options.hide', true);
        },
        async toggle(event) {
          if (event.isTarget) {
            source.toggle('options.hide');
          }
        }
      });
    }
  });
})();
