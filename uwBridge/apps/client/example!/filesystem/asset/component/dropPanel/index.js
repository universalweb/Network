(async () => {
  const dirname = exports.dirname;
  const {
    view,
    component
  } = app;
  console.log('dropPanel');
  await component('dropPanel', {
    asset: {
      css: [`${dirname}style`, `component/base/list/style`],
      template: `${dirname}template`,
    },
    data() {
      return {
        loginStatus() {
          return view.get('@shared.loginStatus');
        }
      };
    }
  });
})();
