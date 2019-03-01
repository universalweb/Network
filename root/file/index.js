module.exports = async (state) => {
  state.logImprt('FILE', __dirname);
  const fs = require('fs');
  const {
    utility: {
      promise
    },
  } = state;
  const operations = {
    write(fileName, contents) {
      return promise((accept, reject) => {
        fs.writeFile(fileName, contents, 'utf8', (error) => {
          if (error) {
            reject(error);
          } else {
            accept();
          }
        });
      });
    },
    read(fileName) {
      return promise((accept, reject) => {
        fs.readFile(fileName, 'utf8', (error, contents) => {
          if (error) {
            reject(error);
          } else {
            accept(contents);
          }
        });
      });
    },
  };
  state.file = operations;
};
