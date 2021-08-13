module.exports = (app) => {
  const uuidRandom = require('uuid/v4');
  const uuidTime = require('uuid/v1');
  const {
    thinkyR,
    config,
    type,
    thinky,
    utility: {
      assign
    }
  } = app;
  if (!thinky.models.credit) {
    thinky.createModel('credit', {
      role: type.string()
        .required(),
      type: type.string()
        .required(),
      host: type.string()
        .required(),
      ip: type.string()
        .required(),
      grant: type.string()
        .required(),
      token: type.string()
        .required(),
      credit: type.string()
        .required(),
      point: type.string()
        .required(),
      accountID: type.string()
        .required(),
      createdAt: type.date()
        .default(thinkyR.now())
    });
  }
  const creditHost = config.credentials.host;
  const CreditScheme = thinky.models.credit;
  const scope = {
    async create(account) {
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
      const newCredit = new CreditScheme(creditObject);
      return newCredit.save();
    },
    async verify(ogCredit, socket) {
      if (ogCredit.id) {
        const credit = await thinkyR.table('credit')
          .filter(assign(ogCredit, {
            accountID: socket.account.id,
          }))
          .run();
        if (credit.length) {
          console.log('Credits are equal');
          return credit;
        }
      }
      console.log(ogCredit, 'CREDITs are not equal. Hacking attempt');
      return false;
    }
  };
  app.model.credit = scope;
};
