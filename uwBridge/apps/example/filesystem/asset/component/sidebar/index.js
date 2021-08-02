(async function sidebarModule() {
  console.log('Sidebar');
  cnsl('sidebar Component', 'notify');
  const dirname = exports._.dirname;
  const list = await demand(`${dirname}items/`);
  await component('sidebar', {
    asset: {
      template: `${dirname}template`,
      partials: {
        sidebarItem: `${dirname}item`
      },
      css: [`${dirname}style`, `${dirname}theme`, `${dirname}custom`]
    },
    data() {
      return {
        items: list.items,
        hide: false,
        loginStatus() {
          return app.get('loginStatus');
        },
        logo() {
          return app.get('logo');
        },
        logoMotto() {
          return app.get('logoMotto');
        },
      };
    },
    onrender() {
      const self = this;
      app.on({
        '*.sectionToggle' (event) {
          event.toggle('hide');
        },
        '*.sidebarToggle sidebarToggle' (event) {
          event.toggle('active');
          app.findComponent('layout')
            .toggle('classes.sidebarOpen');
        }
      });
      app.findComponent('layout')
        .toggle('classes.sidebarOpen');
    }
  });
})();
