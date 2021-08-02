(async () => {
  const {
    assignDeep
  } = app;
  pipe.on(/stats\./, (json) => {
    const stats = app.get('stats');
    console.log(stats, json , '_________________STATS___________________________');
    assignDeep(stats, json.item);
    app.update('stats');
  });
})();
