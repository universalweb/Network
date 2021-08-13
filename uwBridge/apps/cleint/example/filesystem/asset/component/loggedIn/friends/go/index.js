(async () => {
  const {
    component,
    demand,
    router,
    importComponent,
    utility: {
      cnls
    }
  } = app;
  cnls('Go To Profile Component');
  const content = await demand(`${exports.dirname}content.html`);
  await component('goToProfile', {
    asset: {
      template: `${exports.dirname}template`,
      css: [`${exports.dirname}style`],
    },
    data() {
      return {
        overlay: {
          content,
          theme: 'Indigo',
          username: '',
          button: [{
            class: 'full center',
            click: 'goToProfile',
            title: 'Go',
          }]
        },
        hide: false,
        items: [],
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
          console.log(event);
          if (event.isEnter && event.isTarget) {
            const username = source.get('overlay.username');
            router.pushState(`/@${username}`);
            source.fire('toggleOverlay');
            source.set('overlay.username', '');
          }
        },
      });
    },
  });
  await importComponent('goToProfile');
})();
