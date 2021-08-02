(async function () {
  cnsl('icon Component', 'notify');
  await component('icon', {
    asset: {
      template: `${exports._.dirname}template`,
      css: [`${exports._.dirname}style`]
    }
  });
})();
