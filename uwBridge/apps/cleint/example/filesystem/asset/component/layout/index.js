(async () => {
  const dirname = exports.dirname;
  const {
    component,
    view,
    utility: {
      cnsl,
      debounce
    }
  } = app;
  await component('layout', {
    asset: {
      css: [`${dirname}alert`, `${dirname}style`],
      template: `${dirname}template`,
    },
    data() {
      return {
        alerts: [],
        classes: {},
        componentsDynamic() {
          return view.get('components.dynamic');
        },
        componentsLayout() {
          return view.get('components.layout');
        },
        navState() {
          return view.get('navState');
        },
        screenSize() {
          return view.get('screenSize');
        },
      };
    },
    onrender({
      source
    }) {
      cnsl('Layout Component Rendered');
      const closeAlert = debounce(() => {
        console.log('Close Alert');
        source.shift('alerts');
      }, 3500);
      source.on({
        '*.closeAlert'() {
          console.log('Close Alert');
          closeAlert.clear();
          source.shift('alerts');
        },
        '*.refresh'() {
          window.location.reload();
        },
      });
      source.observe('alerts', () => {
        const alerts = source.get('alerts')
          .length;
        if (alerts) {
          closeAlert();
        }
      });
      app.createAlert = (data) => {
        return source.push('alerts', data);
      };
      cnsl('Layout rendered', 'notify');
    }
  });
})();
