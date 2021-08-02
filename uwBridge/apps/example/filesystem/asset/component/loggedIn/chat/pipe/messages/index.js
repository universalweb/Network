(async function () {
  const {
    eachAsync,
  } = app;
  exports.load = function (self, pipes) {
    const getPath = async(item) => {
      let group = item.group;
      if (!group) {
        group = (item.to === $.credit.accountID) ? item.from : item.to;
      }
      const path = `messages.${group}`;
      if (!self.get(path)) {
        await self.set(path, []);
      }
      return path;
    };
    const sortMessages = async(item, type) => {
      const path = await getPath(item);
      await self.syncCollection(path, item, type);
    };
    pipes.messages = pipe.on({
      async create(json) {
        await sortMessages(json.item, 'push');
        self.fire('scrollBottom');
      },
      async read(json) {
        await self.set('page', json.page);
        await eachAsync(json.items, async(item) => {
          sortMessages(item, 'unshift');
        });
        if (!self.get('scrollMode')) {
          self.fire('forceScrollBottom');
          if (self.get('hasMore')) {
            self.fire('loadMore');
          }
        }
        if (!json.items.length) {
          self.set('hasMore', false);
        }
      },
      async update(json) {
        let group = json.item.group;
        if (!group) {
          group = (json.item.to === $.credit.accountID) ? json.item.from : json.item.to;
        }
        const path = `messages.${group}`;
        if (!self.get(path)) {
          await self.set(path, []);
        }
        await self.syncCollection(path, json.item);
      },
    }, {
      prefix: 'message',
    });
  };
})();
