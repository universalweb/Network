module.exports = async (app) => {
  await require('./cache')(app);
  console.log('cache');
  await require('./security')(app);
  console.log('security');
  await require('./network')(app);
  console.log('network');
};
