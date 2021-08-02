(async function () {
  console.log('addFriend Component');
  const {
    alert,
  } = app;
  const content = await demand(`${exports._.dirname}content.html`);
  await component('addFriend', {
    asset: {
      template: `${exports._.dirname}template`,
      css: [`${exports._.dirname}style`],
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
    onrender() {
      const self = this;
      self.on({
        openOverlay(event) {
          self.findComponent('overlay')
            .fire('open', event);
        },
        toggleOverlay(event) {
          self.findComponent('overlay')
            .fire('toggle', event);
        },
        async '*.goToProfile'(event) {
          if (event.isEnter && !event.notTarget) {
            const username = self.get('overlay.username');
            const response = await request('friend.add', {
              item: {
                username,
              },
            });
            let message;
            console.log(response);
            if (response.relationship) {
              message = 'Friend Request Sent';
              self.fire('toggleOverlay');
            } else if (response === 2) {
              message = `Can't send a friend requst to yourself`;
            } else {
              message = 'Friend Request Failed';
            }
            alert({
              message,
            });
          }
        },
      });
    },
  });
  await app.dynamicComponent('addFriend');
})();
