module.exports = function ($, client) {
  const uuidRandom = require('uuid/v4');
  const uuidTime = require('uuid/v1');
  const {
    thinkyR,
    dbModel,
    system
  } = app;
  const scope = $('credit', {}),
    creditHost = system.config.credentials.host,
    creditModel = dbModel.credit,
    thisView = {};
  scope.create = (account) => {
    const creditObject = {
      role: 'client',
      type: 'private',
      profile: 'web',
      grant: 'owner',
      point: 'socket',
      host: creditHost,
      ip: account.ip,
      accountID: account.id,
      token: uuidTime(),
      credit: uuidRandom()
    };
    const newCredit = new creditModel(creditObject);
    return newCredit.save();
  };
  scope.verify = async function (ogCredit) {
    console.log(ogCredit.id);
    const credit = await thinkyR.table('credit')
      .get(ogCredit.id)
      .run();
    if (ogCredit.token === ogCredit.token && ogCredit.credit === ogCredit.credit && ogCredit.host === ogCredit.host && ogCredit.accountID === ogCredit.accountID) {
      console.log('Credits are equal');
      return credit;
    }
    console.log(ogCredit, 'CREDITs are not equal. Hacking attempt');
    return false;
  };
  client.credit = thisView;
};
