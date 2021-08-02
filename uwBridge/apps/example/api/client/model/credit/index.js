module.exports = async function ($, client) {
  const {
    thinky,
    thinkyR,
    type
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
    $.dbModel.credit = thinky.models.credit;
  }
};
