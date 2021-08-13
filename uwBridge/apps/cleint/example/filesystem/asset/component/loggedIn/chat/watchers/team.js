(async () => {
  console.log(view.getComponent);
  const getComponent = () => {
    return view.findComponent('chat');
  };
  watch({
    create(json) => {
      const cmpnt = getComponent();
      cmpnt.push('teams', json.item);
    },
    chatRead(json) => {
      const cmpnt = getComponent();
      console.log(json, 'Chat Teams');
      cmpnt.push('teams', ...json.items);
    },
    update(json) => {
      const cmpnt = getComponent();
      cmpnt.setIndex('teams', json.item.id, json.item);
    },
    delete(json) => {
      const cmpnt = getComponent();
      cmpnt.removeIndex('teams', json.item.id);
    },
  }, {
    prefix: 'team',
  });
})();
