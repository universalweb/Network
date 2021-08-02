(async () => {
  await app.dynamicComponent('navigationbar');
  await app.dynamicComponent('sidebar');
  await app.toggle('components.main.layout');
})();
