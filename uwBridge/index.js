(async () => {
  'use strict';
  await require('./Sentivate')({
    http: {
      connectionTimeout: 60000
    }
  });
})();
