(async function () {
  $.layout = {};
  const {
    debounce
  } = app;
  await component('layout', {
    asset: {
      template: 'component/layout/template',
      css: ['component/layout/alert', 'component/layout/style'],
    },
    data() {
      return {
        alerts: [],
        navState() {
          return app.get('navState');
        },
        componentsLayout() {
          return app.get('components.layout');
        },
        componentsDynamic() {
          return app.get('components.dynamic');
        }
      };
    },
    onrender() {
      const self = this;
      const closeAlert = debounce(() => {
        console.log('Close Alert');
        self.shift('alerts');
      }, 3500);
      self.on({
        '*.refresh' () {
          window.location.reload();
        },
        '*.closeAlert ' () {
          console.log('Close Alert');
          closeAlert.clear();
          self.shift('alerts');
        },
      });
      self.observe('alerts', () => {
        const alerts = self.get('alerts')
          .length;
        if (alerts) {
          closeAlert();
        }
      });
      $.alert = (data) => {
        return self.push('alerts', data);
      };
      cnsl('Layout rendered', 'notify');
    }
  });
})();
