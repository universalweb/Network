module.exports = async (app) => {
  console.log('Require System');
  await require('./system')(app);
  console.log('Require Client');
  await require('./client')(app);
};
