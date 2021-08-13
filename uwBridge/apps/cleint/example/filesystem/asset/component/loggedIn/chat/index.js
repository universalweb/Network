(async () => {
  const dirname = exports.dirname;
  const {
    component,
    demand,
    push,
    view,
    importComponent,
    utility: {
      debounce,
      each,
      cnsl
    }
  } = app;
  import 'js/lib/showdown.js,js/util/markdown.js';
  const watchers = await demand(`${dirname}watch/`);
  setInterval(() => {
    const chat = view.findComponent('chat');
    if (chat) {
      const currentChat = chat.get('currentChat');
      if (currentChat && currentChat.userId) {
        const messages = chat.get(`messages.${currentChat.userId}`);
        each(messages, (item) => {
          item.prettyDate = window.moment.utc(item.createdAt).fromNow();
        });
        chat.update(`messages.${currentChat.userId}`);
      }
    }
  }, 60000);
  await component('chat', {
    asset: {
      css: ['component/sidebar/style', `${dirname}style`],
      demand: ['js/lib/moment/'],
      partials: {
        team: `${dirname}team`,
        user: `${dirname}user`
      },
      template: `${dirname}template`,
    },
    watchers: watchers.load,
    data() {
      return {
        actions: [{
          click: 'friendMode',
          icon: 'person',
          id: 'friends',
          panel: 'friends',
          tooltip: 'Friend Chat',
        }, {
          click: 'publicMode',
          icon: 'group',
          id: 'public',
          panel: 'public',
          tooltip: 'Public Chat',
        }],
        chatMinimize: false,
        chatWindow: false,
        classes: {},
        currentChat: false,
        friends: [],
        fromNow(date) {
          return window.moment.utc(date).fromNow();
        },
        loginStatus() {
          return view.get('loginStatus');
        },
        markdown: $('markdown').html,
        message: '',
        messages: {},
        messagesReadStats: {},
        open: false,
        teams: [],
        teamUsers: [],
      };
    },
    onrender({
      source
    }) {
      source.on({
        async setPanelMode(event, panelName, arrayClear) {
          if (arrayClear) {
            await source.clearArray(arrayClear);
          }
          await source.set('actions.*.active', false);
          await source.set('panel', panelName);
          await source.toggleIndex('actions', panelName, 'active');
        },
        async openChat(event) {
          const item = event.get();
          const path = event.resolve();
          if (source.get('friends.*.active') && source.get('chatWindow')) {
            return;
          }
          await source.set('friends.*.active', false);
          await source.set(`${path}.active`, true);
          console.log(item);
          await source.set('currentChat', item);
          source.set('scrollMode', false);
          source.set('hasMore', true);
          push('message.readAll', {
            item
          });
          push('message.read', {
            item
          });
          await source.set('chatWindow', true);
          await source.set('chatMinimize', false);
          source.fire('forceScrollBottom');
        },
        async close() {
          await view.findComponent('navigationbar')
            .mergeItem('items', 'chat', {
              active: false
            });
          await view.findComponent('chat').set('open', false);
          await source.set('chatWindow', false);
          await source.set('currentChat', false);
          await view.findComponent('layout')
            .set('classes.chatOpen', false);
        },
        async open() {
          await view.findComponent('navigationbar')
            .mergeItem('items', 'chat', {
              active: true
            });
          await view.findComponent('chat').set('open', true);
          await view.findComponent('layout')
            .set('classes.chatOpen', true);
        },
        async closeChat() {
          console.log('closeChat');
          source.set('chatWindow', false);
          source.set('currentChat', false);
        },
        async minimizeChat() {
          console.log('chatMinimize');
          source.toggle('chatMinimize');
        },
        async chatMessage(event) {
          const item = source.get('currentChat');
          const keyCode = event.original.keyCode;
          if (keyCode === 13) {
            event.original.preventDefault();
          } else {
            return;
          }
          push('message.send', {
            to: item.userId,
            message: source.get('message')
          });
          source.set('message', '');
        },
        async friendMode() {
          await source.fire('setPanelMode', 'friends');
          await push('friend.announce');
          await push('friend.read');
        },
        async forceScrollBottom() {
          const scrollBox = source.find('.messages');
          if (!scrollBox) {
            return;
          }
          const clientHeight = scrollBox.clientHeight;
          const scrollHeight = scrollBox.scrollHeight;
          const needToFill = clientHeight === scrollHeight;
          if (needToFill) {
            scrollBox.scrollTop = scrollHeight - clientHeight;
          } else {
            source.set('scrollMode', true);
            scrollBox.scrollTop = scrollHeight - clientHeight;
          }
        },
        async scrollBottom() {
          const scrollBox = source.find('.messages');
          if (!scrollBox) {
            return;
          }
          const scrollTop = scrollBox.scrollTop;
          const clientHeight = scrollBox.clientHeight;
          const scrollHeight = scrollBox.scrollHeight;
          const threshold = scrollHeight - clientHeight - 50;
          console.log(threshold <= scrollTop);
          if (threshold <= scrollTop) {
            scrollBox.scrollTop = scrollHeight - clientHeight;
          }
        },
        async loadMore() {
          if (!source.get('hasMore')) {
            return;
          }
          const scrollBox = source.find('.messages');
          if (!scrollBox) {
            return;
          }
          const scrollTop = scrollBox.scrollTop;
          const clientHeight = scrollBox.clientHeight;
          const scrollHeight = scrollBox.scrollHeight;
          const isNearTop = clientHeight !== scrollHeight && scrollTop < 300;
          const needToFill = clientHeight === scrollHeight;
          if (needToFill || isNearTop) {
            const item = source.get('currentChat');
            const page = source.get('page');
            push('message.read', {
              item,
              page
            });
          }
        },
        async readAll() {
          const item = source.get('currentChat');
          if (item) {
            push('message.readAll', {
              item
            });
          }
        },
        async textarea() {
          source.fire('forceScrollBottom');
          source.fire('readAll');
        }
      });
      source.onRaw({
        scroll: debounce(() => {
          source.fire('loadMore');
        }, 150)
      });
      source.fire('friendMode');
      cnsl('Chat Component', 'notify');
      app.fire('chatToggle');
    },
  });
  view.on({
    async '*.chatToggle'() {
      await view.findComponent('chat').toggle('open');
      await view.findComponent('navigationbar')
        .toggleIndex('items', 'chat', 'active');
      await view.findComponent('layout')
        .toggle('classes.chatOpen');
    },
  });
  view.observe('loginStatus', (newValue) => {
    const chat = view.findComponent('chat');
    if (chat) {
      if (newValue) {
        chat.fire('open');
      } else {
        chat.fire('close');
      }
    }
  });
  const navbarItem = {
    click: 'chatToggle',
    count: 'unreadMessages',
    currentClass: 'chatOpen',
    currentIcon: 'chat_bubble',
    icon: 'chat_bubble_outline',
    id: 'chat',
    loginState: true,
    right: true,
    tooltip: 'Chat',
  };
  await view.findComponent('navigationbar')
    .beforeIndex('items', 'notifications', navbarItem);
  await importComponent('chat');
})();
