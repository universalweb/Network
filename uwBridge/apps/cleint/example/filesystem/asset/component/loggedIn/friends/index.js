(async () => {
  const dirname = exports.dirname;
  const {
    component,
    push,
    view,
    utility: {
      cnsl,
      debounce
    },
    watch
  } = app;
  await component('friends', {
    asset: {
      css: [`${dirname}style`, `component/dropPanel/theme/red`],
      partials: {
        friend: `${dirname}friend`,
      },
      template: `${dirname}template`,
    },
    data() {
      return {
        filter: '',
        filters: [{
          icon: 'people',
          mode: 'read',
          title: 'read',
          tooltip: 'All Friends',
        }, {
          count: 'pendingRecievedFriends',
          icon: 'add_circle',
          mode: 'pending',
          title: 'Pending',
          tooltip: 'Pending Friend Requests',
        }, {
          count: 'pendingSentFriends',
          icon: 'send',
          mode: 'sent',
          title: 'Sent',
          tooltip: 'Pending Sent Requests',
        }, {
          count: 'mutedFriends',
          icon: 'block',
          mode: 'muted',
          title: 'Muted',
          tooltip: 'Muted Friends',
        }, {
          icon: 'search',
          mode: 'search',
          title: 'Search',
          tooltip: 'Search Friends',
        }],
        items: [],
        loginStatus() {
          return view.get('loginStatus');
        },
        page: {},
        search: '',
        searchResults: [],
        stats() {
          return view.get('stats');
        },
        toolbar: {
          items: [{
            afterDemand: {
              click: {
                addFriend: 'openOverlay',
              },
            },
            click: 'loadComponent',
            demand: `${dirname}add/`,
            icon: 'person_add',
            id: 'add',
            tooltip: 'Add A Friend',
          }, {
            afterDemand: {
              click: {
                goToProfile: 'openOverlay',
              },
            },
            click: 'loadComponent',
            demand: `${dirname}go/`,
            icon: 'person',
            id: 'go',
            tooltip: 'Go To Profile',
          }],
        },
      };
    },
    watchers(source) {
      return {
        filters: watch(/friend\.(read|pending|muted|search|sent)/, (json) => {
          const type = json.type.split('.')[1];
          const property = type === 'search' ? 'searchResults' : 'items';
          source.set(`page.${type}`, (json.items.length) ? json.page : false);
          if (type !== 'read') {
            source.syncCollection(property, json.items);
          }
          source.fire('loadMoreCheck');
        }),
        items: {
          methods: {
            create: 'unshift',
          },
          options: {
            prefix: 'friend',
          },
        },
      };
    },
    onrender({
      source
    }) {
      const friendSearch = debounce(async () => {
        const search = source.get('search');
        const page = source.get('page.search');
        await source.clearArray('searchResults');
        if (search.length) {
          push('friend.search', {
            page,
            search,
          });
        }
      }, 200);
      source.on({
        async accept(event) {
          const item = event.get();
          push('friend.accept', {
            item,
          });
        },
        async applyFilter(event, mode) {
          console.log(mode);
          source.set('filter', mode);
          source.fire(mode);
        },
        async decline(event) {
          const item = event.get();
          push('friend.decline', {
            item,
          });
        },
        async delete(event) {
          const item = event.get();
          push('friend.delete', {
            item,
          });
        },
        async filter(event) {
          console.log(event.get());
          const mode = event.get('mode');
          source.fire('applyFilter', mode);
        },
        async loadMore(event) {
          const scrollBox = event.node || source.find('.list.scroll');
          const scrollTop = scrollBox.scrollTop;
          const clientHeight = scrollBox.clientHeight;
          const scrollHeight = scrollBox.scrollHeight;
          const atBottom = (scrollHeight - clientHeight) <= scrollTop + 30;
          if (atBottom || scrollHeight === clientHeight) {
            const filter = source.get('filter');
            const page = source.get(`page.${filter}`);
            if (page !== false) {
              const options = {
                page,
              };
              if (filter === 'search') {
                options.search = source.get('search');
              }
              push(`friend.${filter}`, options);
            }
            console.log('Load More', filter, page);
          }
        },
        async muted() {
          push('friend.muted');
        },
        async pending() {
          push('friend.pending');
        },
        async read() {
          push('friend.read');
        },
        async searchUsername() {
          friendSearch();
        },
        async sent() {
          push('friend.sent');
        },
        async toggleDropdown() {
          const navbarComponent = view.findComponent('navigationbar');
          navbarComponent.updateItem('items', 'friends', (item) => {
            const state = item.dropdown.state;
            item.dropdown.state = !state;
          });
        },
      });
      source.onRaw({
        loadMoreCheck: debounce((event) => {
          source.fire('loadMore', event);
        }, 150),
      });
      cnsl('friends', 'notify');
      // source.fire('toggleDropdown');
      source.fire('applyFilter', 'read');
    },
  });
  const noticationNavbarItem = {
    click: 'toggleDropdown',
    count: 'pendingRecievedFriends',
    dropdown: {
      name: 'friends',
      state: 0,
      theme: 'Red',
    },
    icon: 'people',
    id: 'friends',
    loginState: true,
    right: true,
    tooltip: 'Friends',
  };
  await view.findComponent('navigationbar')
    .beforeIndex('items', 'login', noticationNavbarItem);
})();
