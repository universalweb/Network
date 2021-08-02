(async function () {
  cnsl('Overlay Component', 'notify');
  await component('overlay', {
    asset: {
      template: `${exports._.dirname}template`,
      css: [`${exports._.dirname}style`]
    },
    onrender() {
      const self = this;
      self.on({
        open() {
          self.set('options.hide', false);
        },
        close() {
          self.set('options.hide', true);
        },
        async toggle(event) {
          if (event.isTarget) {
            self.toggle('options.hide');
          }
        }
      });
    }
  });
})();
