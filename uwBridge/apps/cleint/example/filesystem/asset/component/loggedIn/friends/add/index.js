(async () => {
  const {
    component,
    demand,
    createAlert,
    importComponent,
    request,
    utility: {
      cnls
    }
  } = app;
  cnls('addFriend Component');
  const content = await demand(`${exports.dirname}content.html`);
  await component('addFriend', {
    asset: {
      template: `${exports.dirname}template`,
      css: [`${exports.dirname}style`],
    },
    data() {
      return {
        overlay: {
          theme: 'Indigo',
          content,
          button: [{
            title: 'Go',
            click: 'goToProfile',
            class: 'full center',
          }],
          username: '',
        },
        hide: false,
      };
    },
    onrender({
      source
    }) {
      source.on({
        openOverlay(event) {
          source.findComponent('overlay')
            .fire('open', event);
        },
        toggleOverlay(event) {
          source.findComponent('overlay')
            .fire('toggle', event);
        },
        async '*.goToProfile'(event) {
          if (event.isEnter && !event.notTarget) {
            const username = source.get('overlay.username');
            const response = await request('friend.add', {
              item: {
                username,
              },
            });
            let message;
            console.log(response);
            if (response.relationship) {
              message = 'Friend Request Sent';
              source.fire('toggleOverlay');
            } else if (response === 2) {
              message = `Can't send a friend requst to yoursource`;
            } else {
              message = 'Friend Request Failed';
            }
            createAlert({
              message,
            });
          }
        },
      });
    },
  });
  await importComponent('addFriend');
})();
