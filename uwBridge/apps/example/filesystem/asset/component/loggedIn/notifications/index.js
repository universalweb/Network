(async function () {
  const dirname = exports._.dirname;
  cnsl('notifications', 'notify');
  await component('notifications', {
    asset: {
      template: `${dirname}template`,
      css: [`${dirname}style`, `component/dropPanel/theme/lightBlue`],
    },
    pipes() {
      return {
        items: {
          watch: true,
          options: {
            prefix: 'notification',
          },
          methods: {
            create: 'shift',
          },
        }
      };
    },
    data() {
      return {
        loginStatus() {
          return app.get('loginStatus');
        },
        stats() {
          return app.get('stats');
        },
        items: [],
      };
    },
    onrender() {
      const self = this;
      push('notification.read');
    },
  });
  const noticationNavbarItem = {
    id: 'notifications',
    count: 'unreadNotifications',
    tooltip: 'Notifications',
    icon: 'notifications',
    click: 'toggleDropdown',
    loginState: true,
    right: true,
    dropdown: {
      theme: 'LightBlue',
      name: 'notifications',
      state: 0,
    }
  };
  await app.findComponent('navigationbar')
    .beforeIndex('items', 'login', noticationNavbarItem);
})();
