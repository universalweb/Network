(async () => {
  const {
    watch,
    push,
  } = app;
  exports.load = (source, watchers) => {
    watchers.group = watch({
      async create(json) {
        if (json.item.userId === app.credit.accountID || !json.item.status) {
          return;
        }
        push('friend.announceTo', {
          id: json.item.userId,
        });
        source.syncCollection('friends', json.item);
        if (!source.get(`messages.${json.item.id}`)) {
          source.set(`messages.${json.item.id}`, []);
        }
      },
      async update(json) {
        if (json.item.userId === app.credit.accountID) {
          return;
        }
        if (!json.item.status) {
          await source.removeIndex('friends', json.item.userId, 'userId');
          return;
        }
        source.syncCollection('friends', json.item);
        if (!source.get(`messages.${json.item.userId}`)) {
          source.set(`messages.${json.item.userId}`, []);
        }
      },
      async delete(json) {
        source.removeIndex('friends', json.item.userId, 'userId');
      },
    }, {
      prefix: 'group',
      async security() {
        return !app.credit;
      },
    });
    watchers.friends = watch({
      async read(json) {
        source.syncCollection('friends', json.items, 'push', 'userId');
      },
      async create(json) {
        if (json.item.userId === app.credit.accountID || !json.item.status) {
          return;
        }
        push('friend.announceTo', {
          id: json.item.userId,
        });
        source.syncCollection('friends', json.item, 'push', 'userId');
        if (!source.get(`messages.${json.item.id}`)) {
          source.set(`messages.${json.item.id}`, []);
        }
      },
      async update(json) {
        if (json.item.userId === app.credit.accountID) {
          return;
        }
        source.syncCollection('friends', json.item);
        if (!source.get(`messages.${json.item.userId}`)) {
          source.set(`messages.${json.item.userId}`, []);
        }
      },
      async delete(json) {
        console.log(json);
        await source.removeIndex('friends', json.item.userId, 'userId');
      },
    }, {
      prefix: 'friend',
      async security() {
        return !app.credit;
      },
    });
  };
})();
