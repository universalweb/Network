(async function () {
  console.log('Go To Profile Component');
  const {
    router
  } = app;
  const content = await demand(`${exports._.dirname}content.html`);
  await component('goToProfile', {
    asset: {
      template: `${exports._.dirname}template`,
      css: [`${exports._.dirname}style`],
    },
    data() {
      return {
        overlay: {
          theme: 'Indigo',
          content,
          username: '',
          button: [{
            title: 'Go',
            click: 'goToProfile',
            class: 'full center',
          }]
        },
        items: [],
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
          console.log(event);
          if (event.isEnter && event.isTarget) {
            const username = self.get('overlay.username');
            router.pushState(`/@${username}`);
            self.fire('toggleOverlay');
            self.set('overlay.username', '');
          }
        },
      });
    },
  });
  await app.dynamicComponent('goToProfile');
})();
