module.exports = async (app, extend) => {
  const {
    config,
    utility: {
      has
    }
  } = app;
  const allowedDomainsCache = config.http.plugins.allowedDomains;
  const allowedDomains = (req, res, next) => {
    if (has(allowedDomainsCache, req.headers.host)) {
      return next();
    } else {
      console.log(req.headers.host, allowedDomainsCache);
      res.sendStatus(403);
    }
  };
  extend.allowedDomains = allowedDomains;
};
