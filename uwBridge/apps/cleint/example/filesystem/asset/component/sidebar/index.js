(async () => {
  console.trace('Sidebar');
  const dirname = exports.dirname;
  const {
    component,
    view,
    utility: {
      cnsl
    }
  } = app;
  import { items } from '${dirname}items/';
  console.log(items);
  await component('sidebar', {
    asset: {
      template: `${dirname}template`,
      partials: {
        sidebarItem: `${dirname}item`
      },
      css: [`${dirname}style`, `${dirname}theme`]
    },
    data() {
      return {
        items,
        hide: false,
        loginStatus() {
          return view.get('loginStatus');
        },
        logo() {
          return view.get('logo');
        },
        logoMotto() {
          return view.get('logoMotto');
        },
      };
    },
    onrender() {
      cnsl('Sidebar Component', 'notify');
      view.on({
        '*.sectionToggle'(event) {
          event.toggle('hide');
        },
        '*.sidebarToggle sidebarToggle'(event) {
          event.toggle('active');
          view.findComponent('layout')
            .toggle('classes.sidebarOpen');
        }
      });
    }
  });
})();
