(async function () {
  const dirname = exports._.dirname;
  console.log('dropPanel');
  await component('dropPanel', {
    asset: {
      template: `${dirname}template`,
      css: [`${dirname}style`, `component/base/list/style`]
    },
    data() {
      return {
        loginStatus() {
          return app.get('loginStatus');
        }
      };
    }
  });
})();
