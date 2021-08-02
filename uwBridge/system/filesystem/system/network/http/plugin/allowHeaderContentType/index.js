module.exports = async (app, extend) => {
  const allowHeaderContentType = (req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  };
  extend.allowHeaderContentType = allowHeaderContentType;
};
