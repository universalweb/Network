module.exports = async function ($) {
  const {
    thinkyR
  } = app;
  await thinkyR.table('group')
    .delete()
    .run();
};
