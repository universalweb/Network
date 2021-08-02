(async function () {
  cnsl('hero Component', 'notify');
  await component('hero', {
    asset: {
      template: `${exports._.dirname}template`,
      css: [`${exports._.dirname}style`, `${exports._.dirname}custom`]
    }
  });
})();
