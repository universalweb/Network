(async function () {
  cnsl('btn Component', 'notify');
  await component('inputGroup', {
    asset: {
      template: `${exports._.dirname}template`
    }
  });
})();
