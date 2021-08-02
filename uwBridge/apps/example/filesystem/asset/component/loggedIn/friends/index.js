(async function () {
  const dirname = exports._.dirname;
  const { debounce } = app;
  await component('friends', {
    asset: {
      template: `${dirname}template`,
      css: [`${dirname}style`, `component/dropPanel/theme/red`],
      partials: {
        friend: `${dirname}friend`,
      },
    },
    pipes(self) {
      return {
        items: {
          watch: true,
          options: {
            prefix: 'friend',
          },
          methods: {
            create: 'unshift',
          },
        },
        filters: pipe.on(/friend\.(read|pending|muted|search)/, (json) => {
          const type = json.type.split('.')[1];
          const property = type === 'search' ? 'searchResults' : 'items';
          self.set(`page.${type}`, (json.items.length) ? json.page : false);
          if (type !== 'read') {
            self.syncCollection(property, json.items);
          }
          self.fire('loadMoreCheck');
        }),
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
        filters: [{
          title: 'read',
          icon: 'people',
          tooltip: 'All Friends',
          mode: 'read',
        }, {
          count: 'pendingRecievedFriends',
          title: 'Pending',
          icon: 'notifications',
          tooltip: 'Pending Friend Requests',
          mode: 'pending',
        }, {
          count: 'mutedFriends',
          title: 'Muted',
          icon: 'block',
          tooltip: 'Muted Friends',
          mode: 'muted',
        }, {
          title: 'Search',
          icon: 'search',
          tooltip: 'Search Friends',
          mode: 'search',
        }],
        toolbar: {
          items: [{
            id: 'add',
            icon: 'person_add',
            click: 'loadComponent',
            tooltip: 'Add A Friend',
            demand: `${dirname}add/`,
            afterDemand: {
              click: {
                addFriend: 'openOverlay',
              },
            },
          }, {
            id: 'go',
            icon: 'person',
            click: 'loadComponent',
            tooltip: 'Go To Profile',
            demand: `${dirname}go/`,
            afterDemand: {
              click: {
                goToProfile: 'openOverlay',
              },
            },
          }],
        },
        page: {},
        items: [],
        filter: '',
        searchResults: [],
        search: '',
      };
    },
    onrender() {
      const self = this;
      const friendSearch = debounce(async () => {
        const search = self.get('search');
        const page = self.get('page.search');
        await self.clearArray('searchResults');
        if (search.length) {
          push('friend.search', {
            search,
            page,
          });
        }
      }, 200);
      self.on({
        async searchUsername() {
          friendSearch();
        },
        async toggleDropdown() {
          const navbarComponent = app.findComponent('navigationbar');
          navbarComponent.updateItem('items', 'friends', (item) => {
            const state = item.dropdown.state;
            item.dropdown.state = !state;
          });
        },
        async accept(event) {
          const item = event.get();
          push('friend.accept', {
            item,
          });
        },
        async decline(event) {
          const item = event.get();
          push('friend.decline', {
            item,
          });
        },
        async read() {
          push('friend.read');
        },
        async pending() {
          push('friend.pending');
        },
        async muted() {
          push('friend.muted');
        },
        async applyFilter(event, mode) {
          console.log(mode);
          self.set('filter', mode);
          self.fire(mode);
        },
        async filter(event) {
          console.log(event.get());
          const mode = event.get('mode');
          self.fire('applyFilter', mode);
        },
        async loadMore(event) {
          const scrollBox = event.node || self.find('.list.scroll');
          const scrollTop = scrollBox.scrollTop;
          const clientHeight = scrollBox.clientHeight;
          const scrollHeight = scrollBox.scrollHeight;
          const atBottom = (scrollHeight - clientHeight) <= scrollTop + 30;
          if (atBottom || scrollHeight === clientHeight) {
            const filter = self.get('filter');
            const page = self.get(`page.${filter}`);
            if (page !== false) {
              const options = {
                page,
              };
              if (filter === 'search') {
                options.search = self.get('search');
              }
              push(`friend.${filter}`, options);
            }
            console.log('Load More', filter, page);
          }
        },
      });
      self.onRaw({
        loadMoreCheck: debounce((event) => {
          self.fire('loadMore', event);
        }, 150),
      });
      cnsl('friends', 'notify');
      // self.fire('toggleDropdown');
      self.fire('applyFilter', 'read');
    },
  });
  const noticationNavbarItem = {
    count: 'pendingRecievedFriends',
    id: 'friends',
    tooltip: 'Friends',
    icon: 'people',
    click: 'toggleDropdown',
    loginState: true,
    right: true,
    dropdown: {
      theme: 'Red',
      name: 'friends',
      state: 0,
    },
  };
  await app.findComponent('navigationbar')
    .beforeIndex('items', 'login', noticationNavbarItem);
})();
