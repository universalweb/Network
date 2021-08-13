(async () => {
  const {
    component,
    demand,
    push,
    importComponent,
    utility: {
      cnsl
    }
  } = app;
  cnsl('addAccountNote Component');
  const content = await demand(`${exports.dirname}content.html`);
  await component('addAccountNote', {
    asset: {
      css: [`${exports.dirname}style`],
      template: `${exports.dirname}template`,
    },
    data() {
      return {
        overlay: {
          theme: 'Indigo',
          content,
          button: [{
            title: 'Save',
            click: 'save',
            class: 'full center',
          }],
          note: {
            title: '',
            network: '',
            account: {
              username: '',
              password: '',
            },
            proxy: {
              ip: '',
              port: '',
              username: '',
              password: '',
              ipVersion: 'IPv4'
            },
          },
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
        async clear() {
          source.assign('overlay.note', {
            account: {
              password: '',
              username: '',
            },
            network: '',
            title: '',
            proxy: {
              ip: '',
              ipVersion: 'IPv4',
              password: '',
              port: '',
              username: '',
            },
          });
        },
        '*.save'() {
          const item = source.get('overlay.note');
          push('account.create', {
            item
          });
          source.fire('clear');
          source.fire('toggleOverlay');
        }
      });
    },
  });
  await importComponent('addAccountNote');
})();
