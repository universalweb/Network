module.exports = async (app) => {
  const {
    thinky,
    type,
    thinkyR
  } = app;
  if (!thinky.models.user) {
    thinky.createModel('user', {
      username: type.string()
        .max(64)
        .min(3)
        .required(),
      password: type.string()
        .max(128)
        .min(3)
        .required(),
      email: type.string()
        .max(64)
        .min(5)
        .required(),
      referrer: type.string()
        .max(64)
        .optional(),
      role: type.string()
        .max(64)
        .min(3)
        .required(),
      createdAt: type.date()
        .default(thinkyR.now()),
    });
  }
};
