(async () => {
  const dirname = exports.dirname;
  const {
    component,
    push,
    notify,
    view,
    utility: {
      cnsl
    }
  } = app;
  cnsl('notifications', 'notify');
  await component('notifications', {
    asset: {
      css: [`${dirname}style`, `component/dropPanel/theme/lightBlue`],
      template: `${dirname}template`,
    },
    data() {
      return {
        items: [],
        loginStatus() {
          return view.get('loginStatus');
        },
        stats() {
          return view.get('stats');
        },
        title: 'Notifications',
      };
    },
    onrender({
      source
    }) {
      source.on({
        'notification.create'(json) {
          notify(json.item);
        },
      });
      push('notification.read');
    },
    watchers() {
      return {
        items: {
          methods: {
            create: 'unshift',
          },
          options: {
            prefix: 'notification',
          },
        },
      };
    },
  });
  const noticationNavbarItem = {
    click: 'toggleDropdown',
    count: 'unreadNotifications',
    dropdown: {
      name: 'notifications',
      state: 0,
      theme: 'LightBlue',
    },
    icon: 'notifications',
    id: 'notifications',
    loginState: true,
    right: true,
    tooltip: 'Notifications',
  };
  await view.findComponent('navigationbar')
    .beforeIndex('items', 'login', noticationNavbarItem);
})();
