(async function () {
  const dirname = exports._.dirname;
  import 'component/dropPanel/';
  const list = await demand(`${dirname}items/`);
  console.log('navigationbar');
  await component('navigationbar', {
    asset: {
      template: `${dirname}template`,
      css: [`${dirname}style`]
    },
    data() {
      return {
        loginStatus() {
          return app.get('loginStatus');
        },
        stats() {
          return app.get('stats');
        },
        items: list.items
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
