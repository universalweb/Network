(async () => {
  const dirname = exports.dirname;
  const {
    component,
    push,
    view,
    watch,
    utility: {
      cnsl
    }
  } = app;
  cnsl('Accounts Drop panel', 'notify');
  await component('accounts', {
    asset: {
      template: `${dirname}template`,
      css: [`${dirname}style`, `component/dropPanel/theme/lightBlue`],
      partials: {
        account: `${dirname}account`,
      },
    },
    watchers(source) {
      return {
        items: {
          options: {
            prefix: 'account',
          },
          methods: {
            create: 'unshift',
          },
        },
        account: watch('account.read', (json) => {
          source.set(`page`, (json.items.length) ? json.page : false);
          source.syncCollection('items', json.items);
          source.fire('loadMoreCheck');
        }),
      };
    },
    data() {
      return {
        loginStatus() {
          return view.get('loginStatus');
        },
        stats() {
          return view.get('stats');
        },
        toolbar: {
          items: [{
            afterDemand: {
              click: {
                addAccountNote: 'openOverlay',
              },
            },
            click: 'loadComponent',
            demand: `${dirname}add/`,
            icon: 'add',
            id: 'add',
            tooltip: 'Create a new account note',
          }],
        },
        items: [],
        page: 0,
        title: 'Accounts'
      };
    },
    onrender({
      source
    }) {
      source.on({
        '*.delete'(event) {
          const item = event.get();
          push('account.delete', {
            item
          });
        },
        '*.updateNote'(event) {
          const item = event.get();
          push('account.update', {
            item
          });
        },
        async loadMore(event) {
          const scrollBox = event.node || source.find('.list.scroll');
          const scrollTop = scrollBox.scrollTop;
          const clientHeight = scrollBox.clientHeight;
          const scrollHeight = scrollBox.scrollHeight;
          const atBottom = (scrollHeight - clientHeight) <= scrollTop + 30;
          if (atBottom || scrollHeight === clientHeight) {
            const page = source.get(`page`);
            if (page !== false) {
              const options = {
                page,
              };
              push(`account.read`, options);
            }
            console.log('Load More', page);
          }
        },
      });
      push('account.read');
    },
  });
  const navbarItem = {
    click: 'toggleDropdown',
    dropdown: {
      name: 'accounts',
      state: 0,
      theme: 'LightBlue',
    },
    icon: 'person',
    id: 'accounts',
    loginState: true,
    right: true,
    tooltip: 'Save different account details as notes',
  };
  await view.findComponent('navigationbar')
    .beforeIndex('items', 'chat', navbarItem);
})();
