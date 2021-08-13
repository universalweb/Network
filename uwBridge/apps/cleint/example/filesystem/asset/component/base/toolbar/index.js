(async () => {
  const {
    component,
    utility: {
      cnsl
    },
    view
  } = app;
  const dirname = exports.dirname;
  cnsl('toolbar');
  await component('toolbar', {
    asset: {
      template: `${dirname}template`,
      css: [`${dirname}style`]
    },
    data() {
      return {
        loginStatus() {
          return view.get('loginStatus');
        }
      };
    },
    onrender({
      source
    }) {
      source.on({
        async '*.toggleDropdown'(event) {
          const state = event.get('dropdown.state');
          await source.set('items.*.dropdown.state', 0);
          await event.set('dropdown.state', !state);
        },
      });
    }
  });
})();
