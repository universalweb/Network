(async () => {
  const {
    push,
    view
  } = app;
  view.observe('loginStatus', (newValue) => {
    if (newValue) {
      console.log(newValue);
      push('stats.read');
    }
  });
})();
