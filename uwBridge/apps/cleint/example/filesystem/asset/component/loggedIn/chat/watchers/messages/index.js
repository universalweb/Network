(async () => {
  const {
    watch,
    utility: {
      eachAsync
    },
  } = app;
  exports.load = (source, watchers) => {
    const getPath = async (item) => {
      let group = item.group;
      if (!group) {
        group = (item.to === $.credit.accountID) ? item.from : item.to;
      }
      const path = `messages.${group}`;
      if (!source.get(path)) {
        await source.set(path, []);
      }
      return path;
    };
    const sortMessages = async (item, type) => {
      const path = await getPath(item);
      await source.syncCollection(path, item, type);
    };
    watchers.messages = watch({
      async create(json) {
        await sortMessages(json.item, 'push');
        source.fire('forceScrollBottom');
      },
      async read(json) {
        await source.set('page', json.page);
        await eachAsync(json.items, async (item) => {
          await sortMessages(item, 'unshift');
        });
        if (!source.get('scrollMode')) {
          source.fire('forceScrollBottom');
          if (source.get('hasMore')) {
            source.fire('loadMore');
          }
        }
        if (!json.items.length) {
          source.set('hasMore', false);
        }
      },
      async update(json) {
        let group = json.item.group;
        if (!group) {
          group = (json.item.to === $.credit.accountID) ? json.item.from : json.item.to;
        }
        const path = `messages.${group}`;
        if (!source.get(path)) {
          await source.set(path, []);
        }
        await source.syncCollection(path, json.item);
      },
    }, {
      prefix: 'message',
    });
  };
})();
