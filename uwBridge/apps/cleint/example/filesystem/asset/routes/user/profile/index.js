(async () => {
  const {
    createAlert,
    component,
    watch,
    push,
    router,
    request,
    utility: {
      assign,
      cnsl
    }
  } = app;
  cnsl('Profile Page');
  const checkIfRoot = () => {
    const pathname = router.location.pathname;
    return pathname === '/@/' || pathname === '/@';
  };
  await component({
    model: exports,
    asset: {
      template: `${exports.dirname}template`,
      css: [`${exports.dirname}style`],
    },
    watchers(source) {
      return {
        friend: watch({
          update(json) {
            console.log(json);
            if (json.item.userId === source.get('profile.userId')) {
              source.set('profile', json.item);
            }
          },
          create(json) {
            console.log(json);
            if (json.item.userId === source.get('profile.userId')) {
              source.set('profile', json.item);
            }
          },
          delete(json) {
            if (json.item.from === source.get('profile.userId')) {
              source.fire('getProfile');
            }
          },
        }, {
          prefix: 'friend',
        }),
        profile: watch({
          read(json) {
            console.log(json);
            source.set('profile', json.profile);
          },
        }, {
          prefix: 'profile',
        }),
      };
    },
    data() {
      return {
        profile: {},
      };
    },
    onrender({
      source
    }) {
      source.on({
        '*.block'() {},
        '*.report'() {},
        '*.follow'() {},
        '*.unfollow'() {},
        async '*.addFriend'() {
          const profile = source.get('profile');
          const results = await request('friend.add', {
            item: profile,
          });
          if (results.status === 1) {
            assign(profile, results.relationship);
            source.update('profile');
          } else {
            createAlert({
              message: 'Friend request failed',
            });
          }
        },
        async '*.accept'() {
          const results = await request('friend.accept', {
            item: source.get('profile'),
          });
          if (results.status === 1) {
            source.set('profile', results.item);
          }
        },
        async '*.deleteFriend'() {
          await request('friend.delete', {
            item: source.get('profile'),
          });
          source.set('profile.id', null);
          source.set('profile.status', null);
          source.set('profile.from', null);
          source.set('profile.to', null);
        },
        getProfile() {
          let profile;
          if (checkIfRoot()) {
            view.set('pageTitle', `Profile`);
          } else {
            profile = {
              item: {
                username: router.location.paths[0].replace('@', ''),
              },
            };
            view.set('pageTitle', `@${profile.item.username}`);
          }
          push('profile.read', profile);
        },
      });
      source.fire('getProfile');
    },
  });
})();
