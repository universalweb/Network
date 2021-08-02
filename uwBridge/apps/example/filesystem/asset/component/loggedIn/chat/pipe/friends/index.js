(async function () {
  exports.load = function (self, pipes) {
    pipes.group = pipe.on({
      async create(json) {
        if (json.item.id === $.credit.accountID) {
          return;
        }
        push('friend.announceTo', {
          id: json.item.userId,
        });
        self.syncCollection('friends', json.item);
        if (!self.get(`messages.${json.item.id}`)) {
          self.set(`messages.${json.item.id}`, []);
        }
      },
      async update(json) {
        if (json.item.id === $.credit.accountID) {
          return;
        }
        self.syncCollection('friends', json.item);
        if (!self.get(`messages.${json.item.userId}`)) {
          self.set(`messages.${json.item.userId}`, []);
        }
      },
      async delete(json) {
        self.removeIndex('friends', json.item.id);
      },
    }, {
      prefix: 'group',
      async security() {
        return !$.credit;
      }
    });
    pipes.friends = pipe.on({
      async create(json) {
        if (json.item.id === $.credit.accountID) {
          return;
        }
        push('friend.announceTo', {
          id: json.item.userId,
        });
        self.syncCollection('friends', json.item);
        if (!self.get(`messages.${json.item.id}`)) {
          self.set(`messages.${json.item.id}`, []);
        }
      },
      async update(json) {
        if (json.item.id === $.credit.accountID) {
          return;
        }
        self.syncCollection('friends', json.item);
        if (!self.get(`messages.${json.item.userId}`)) {
          self.set(`messages.${json.item.userId}`, []);
        }
      },
      async delete(json) {
        self.removeIndex('friends', json.item.userId);
      },
    }, {
      prefix: 'friend',
      async security() {
        return !$.credit;
      }
    });
  };
})();
