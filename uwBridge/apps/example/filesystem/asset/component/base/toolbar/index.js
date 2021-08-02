(async function () {
  const dirname = exports._.dirname;
  console.log('toolbar');
  await component('toolbar', {
    asset: {
      template: `${dirname}template`,
      css: [`${dirname}style`]
    },
    data() {
      return {
        loginStatus() {
          return app.get('loginStatus');
        }
      };
    },
    onrender() {
      const self = this;
      self.on({
        async '*.toggleDropdown'(event) {
          const state = event.get('dropdown.state');
          await self.set('items.*.dropdown.state', 0);
          await event.set('dropdown.state', !state);
        },
      });
    }
  });
})();
