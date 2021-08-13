(async () => {
  console.log('Settings Page');
  const {
    createAlert,
    component,
    watch,
    push
  } = app;
  await component({
    model: exports,
    asset: {
      template: `${exports.dirname}template`,
      css: [`${exports.dirname}style`],
    },
    watchers(source) {
      return {
        user: watch({
          update(json) {
            createAlert({
              message: 'Settings updated'
            });
            source.set('profile', json.item);
          },
          read(json) {
            source.set('profile', json.item);
          }
        }, {
          prefix: 'settings'
        })
      };
    },
    data() {
      return {
        password: '',
        profile() {
          return view.get('profile');
        },
      };
    },
    onrender({
      source
    }) {
      source.on({
        load() {
          push('settings.read');
        },
        '*.update'() {
          push('settings.update', {
            item: {
              username: source.get('profile.username'),
              email: source.get('profile.email'),
              password: source.get('password')
            }
          });
        }
      });
      source.fire('load');
    },
  });
})();
