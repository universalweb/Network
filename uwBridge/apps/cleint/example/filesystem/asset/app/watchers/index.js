(async () => {
  const {
    watch,
    view,
    utility: {
      assignDeep
    }
  } = app;
  view.set('stats', {});
  watch(/stats\./, (json) => {
    const stats = view.get('stats');
    console.log(stats, json, '_________________STATS___________________________');
    assignDeep(stats, json.item);
    app.update('stats');
  });
})();
