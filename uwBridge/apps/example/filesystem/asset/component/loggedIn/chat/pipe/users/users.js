(async function () {
  const getComponent = () => app.findComponent('chat');
  pipe.on({
    create: (json) => {
      const cmpnt = getComponent();
      cmpnt.push('users', json.item);
    },
    read: (json) => {
      console.log(json);
      const cmpnt = getComponent();
      cmpnt.push('users', ...json.items);
    },
    update: (json) => {
      const cmpnt = getComponent();
      cmpnt.setIndex('users', json.item.id, json.item);
    },
    delete: (json) => {
      const cmpnt = getComponent();
      cmpnt.removeIndex('users', json.item.id);
    },
  }, {
    prefix: 'chatUsers',
  });
})();
