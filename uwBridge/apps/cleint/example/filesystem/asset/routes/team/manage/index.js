(async () => {
  const {
    alert,
  } = app;
  exports.watchers = watch({
    create(json) {
      $.navState.push('teams', json.item);
    },
    read(json) {
      console.log(json);
      $.navState.push('teams', ...json.items);
    },
    update(json) {
      $.navState.setIndex('teams', json.item.id, json.item);
    },
    delete(json) {
      $.navState.removeIndex('teams', json.item.id);
    },
  }, {
    prefix: 'team'
  });
  await component({
    model: exports,
    asset: {
      template: 'component/listPage',
      partials: {
        contentPartial: 'team/manage',
      },
      css: ['component/base/list', 'component/page']
    },
    config: {
      data() {
        return {
          teams: [],
          createTeam: {
            name: ''
          },
          page: 0,
          language: {
            title: 'Team Management',
            description: 'Create a team to achieve goals quicker, share insights & research analytics.'
          },
          theme: 'Purple'
        };
      },
      onrender({source}) {
        this.on({
          deleteTeam(event) {
            const item = event.get();
            console.log(item);
            push('team.delete', {
              item,
            });
          },
          updateTeam(event) {
            const item = event.get();
            console.log(item);
            push('team.update', {
              item,
            });
          },
          '*.createTeam': function (event) {
            const keyCode = event.original.keyCode;
            if (keyCode && keyCode !== 13) {
              return;
            }
            const item = event.get('createTeam');
            if (!item.name.length) {
              createAlert({
                message: `Team ${item.name} created`
              });
            }
            item.type = 1;
            push('team.create', {
              item,
            });
            event.set('createTeam.name', '');
          }
        });
        push('team.read');
      }
    }
  });
  exports.open = () => {
    view.set('pageTitle', 'Team Management');
  };
  exports.close = () => {
  };
})();
