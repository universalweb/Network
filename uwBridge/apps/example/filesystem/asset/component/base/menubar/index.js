(async function () {
  cnsl('menubar Component', 'notify');
  await component('menubar', {
    asset: {
      template: `${exports._.dirname}template`,
      css: [`${exports._.dirname}style`]
    }
  });
})();
