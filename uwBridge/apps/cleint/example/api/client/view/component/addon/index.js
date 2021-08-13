module.exports = (app) => {
  const {
    thinkyR,
    utility: {
      each,
      eachAsync,
      ensureArray,
      model
    }
  } = app;
  const scope = {
    packages: {},
    async networkBase(auth) {
      if (!auth.file.includes('^routes/auth/network/([^\\/]*\\.(.*?))$')) {
        auth.file.push('^routes/auth/network/([^\\/]*\\.(.*?))$');
        auth.file.push('^language/auth/network/([^\\/]*\\.(.*?))$');
      }
    },
    async free(auth) {
      await scope.networkBase(auth);
      // console.log(auth.file, 'after Network base \n');
      await scope.packages.linkedin.free(auth);
      await scope.packages.twitter.free(auth);
      await scope.packages.instagram.free(auth);
      await scope.packages.facebook.free(auth);
      // console.log(auth.file, 'after base');
    },
    async setPlan(socket, addons) {
      const user = await thinkyR.table('user')
        .get(socket.account.id)
        .pluck('auth')
        .run();
      const auth = user.auth;
      await eachAsync(addons, async (item) => {
        await scope[item](auth);
      });
      await thinkyR.table('user')
        .get(socket.account.id)
        .update({
          auth
        })
        .run();
      auth.file = new RegExp(auth.file.join('|'), 'm');
      socket.account.auth = auth;
    },
    async updatePacks(socket) {
      console.log('Updating Packs', socket.account.id);
      const user = await thinkyR.table('user')
        .get(socket.account.id)
        .pluck('auth', 'addons')
        .run();
      const auth = user.auth;
      // console.log(user, 'updatePacks');
      auth.file = [];
      await eachAsync(user.addons, async (item) => {
        await scope[item](auth);
      });
      // console.log(auth, 'updatedPacks');
      await thinkyR.table('user')
        .get(socket.account.id)
        .update({
          auth
        })
        .run();
    },
    install(locations) {
      return async function(auth) {
        each(ensureArray(locations), (item) => {
          if (!auth.file.includes(item)) {
            auth.file.push(item);
          }
        });
      };
    }
  };
  model('addon', scope);
};
