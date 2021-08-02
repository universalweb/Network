(async function () {
  cnsl('btn Component', 'notify');
  await component('btn', {
    asset: {
      template: `${exports._.dirname}template`,
      css: [`${exports._.dirname}style`]
    }
  });
})();
