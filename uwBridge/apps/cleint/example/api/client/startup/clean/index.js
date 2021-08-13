module.exports = async (app) => {
  const {
    thinkyR
  } = app;
  await thinkyR.table('group')
    .delete()
    .run();
};
