(async () => {
  const dirname = exports.dirname;
  const {
    component
  } = app;
  await component('panel', {
    asset: {
      css: [`${dirname}style`],
      template: `${dirname}template`,
    },
    onrender({
      source
    }) {
      source.on({
        closePanel() {
          const shouldClose = source.get('panel.close');
          if (shouldClose && shouldClose()) {
            source.set('panel.hide', true);
          }
        },
        openPanel() {
          source.set('panel.hide', false);
        },
        togglePanel() {
          source.toggle('panel.hide');
        }
      });
    },
  });
})();
