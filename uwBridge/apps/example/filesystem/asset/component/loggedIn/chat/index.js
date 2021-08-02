(async function () {
  const dirname = exports._.dirname;
  const {
    debounce
  } = app;
  const pipes = await demand(`${dirname}pipe/`);
  await component('chat', {
    asset: {
      template: `${dirname}template`,
      partials: {
        team: `${dirname}team`,
        user: `${dirname}user`
      },
      css: ['component/sidebar/style', `${dirname}style`]
    },
    pipes: pipes.load,
    data() {
      return {
        loginStatus() {
          return app.get('loginStatus');
        },
        chatWindow: false,
        chatMinimize: false,
        open: false,
        teamUsers: [],
        teams: [],
        friends: [],
        messages: {},
        messagesReadStats: {},
        classes: {},
        currentChat: false,
        message: '',
        actions: [{
          id: 'friends',
          icon: 'group',
          tooltip: 'Friends',
          panel: 'friends',
          click: 'friendMode'
        }]
      };
    },
    onrender() {
      const self = this;
      app.on({
        async '*.chatToggle' () {
          await self.toggle('open');
          await app.findComponent('navigationbar')
            .toggleIndex('items', 'chat', 'active');
          await app.findComponent('layout')
            .toggle('classes.chatOpen');
        },
      });
      self.on({
        async setPanelMode(event, panelName, arrayClear) {
          if (arrayClear) {
            await self.clearArray(arrayClear);
          }
          await self.set('actions.*.active', false);
          await self.set('panel', panelName);
          await self.toggleIndex('actions', panelName, 'active');
        },
        async openChat(event) {
          const item = event.get(),
            path = event.resolve();
          if (self.get('friends.*.active') && self.get('chatWindow')) {
            return;
          }
          await self.set('friends.*.active', false);
          await self.set(`${path}.active`, true);
          console.log(item);
          await self.set('currentChat', item);
          self.set('scrollMode', false);
          self.set('hasMore', true);
          push('message.readAll', {
            item
          });
          push('message.read', {
            item
          });
          await self.toggle('chatWindow');
          self.fire('forceScrollBottom');
        },
        async closeChat() {
          console.log('closeChat');
          self.set('chatWindow', false);
          self.set('currentChat', false);
        },
        async minimizeChat() {
          console.log('chatMinimize');
          self.toggle('chatMinimize');
        },
        async chatMessage(event) {
          const item = self.get('currentChat'),
            keyCode = event.original.keyCode;
          if (keyCode !== 13) {
            return;
          } else {
            event.original.preventDefault();
          }
          push('message.sendFriend', {
            to: item.userId,
            message: self.get('message')
          });
          self.set('message', '');
        },
        async friendMode() {
          await self.fire('setPanelMode', 'friends');
        },
        async forceScrollBottom() {
          const scrollBox = self.find('.messages');
          if (!scrollBox) {
            return;
          }
          const clientHeight = scrollBox.clientHeight;
          const scrollHeight = scrollBox.scrollHeight;
          const needToFill = clientHeight === scrollHeight;
          if (needToFill) {
            scrollBox.scrollTop = scrollHeight - clientHeight;
          } else {
            self.set('scrollMode', true);
            scrollBox.scrollTop = scrollHeight - clientHeight;
          }
        },
        async scrollBottom() {
          const scrollBox = self.find('.messages');
          if (!scrollBox) {
            return;
          }
          const scrollTop = scrollBox.scrollTop;
          const clientHeight = scrollBox.clientHeight;
          const scrollHeight = scrollBox.scrollHeight;
          const threshold = scrollHeight - clientHeight - 50;
          if (threshold <= scrollTop) {
            scrollBox.scrollTop = scrollHeight - clientHeight;
          }
        },
        async loadMore() {
          if (!self.get('hasMore')) {
            return;
          }
          const scrollBox = self.find('.messages');
          if (!scrollBox) {
            return;
          }
          const scrollTop = scrollBox.scrollTop;
          const clientHeight = scrollBox.clientHeight;
          const scrollHeight = scrollBox.scrollHeight;
          const isNearTop = clientHeight !== scrollHeight && scrollTop < 300;
          const needToFill = clientHeight === scrollHeight;
          if (needToFill || isNearTop) {
            const item = self.get('currentChat');
            const page = self.get('page');
            push('message.read', {
              item,
              page
            });
          }
        },
        async readAll() {
          const item = self.get('currentChat');
          if (item) {
            push('message.readAll', {
              item
            });
          }
        },
        async textarea() {
          self.fire('forceScrollBottom');
          self.fire('readAll');
        }
      });
      self.onRaw({
        scroll: debounce(() => {
          self.fire('loadMore');
        }, 150)
      });
      //app.fire('chatToggle');
      self.fire('friendMode');
      push('friend.announce');
      cnsl('Chat Component', 'notify');
    },
  });
  const navbarItem = {
    count: 'unreadMessages',
    id: 'chat',
    icon: 'chat_bubble_outline',
    currentIcon: 'chat_bubble',
    tooltip: 'Chat',
    click: 'chatToggle',
    currentClass: 'chatOpen',
    loginState: true,
    right: true,
  };
  await app.findComponent('navigationbar')
    .beforeIndex('items', 'friends', navbarItem);
  await app.dynamicComponent('chat');
})();
