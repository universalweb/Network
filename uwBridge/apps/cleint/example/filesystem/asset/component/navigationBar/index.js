(async () => {
  const dirname = exports.dirname;
  const {
    component,
    view,
    utility: {
      cnsl
    }
  } = app;
  import { items } from '${dirname}items/';
  import 'component/dropPanel/';
  await component('navigationbar', {
    asset: {
      template: `${dirname}template`,
      css: [`${dirname}style`]
    },
    data() {
      return {
        loginStatus() {
          return view.get('loginStatus');
        },
        stats() {
          return view.get('stats');
        },
        items
      };
    },
    onrender({
      source
    }) {
      cnsl('Navigationbar Component', 'notify');
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
