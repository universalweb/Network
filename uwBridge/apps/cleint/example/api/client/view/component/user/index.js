module.exports = async (app) => {
  require('./model')(app);
  const scrypt = require('scrypt');
  const validator = require('email-validator');
  const {
    utility: {
      stringify,
      assign,
      get,
    },
    thinkyR,
    thinky,
    api
  } = app;
  const UserScheme = thinky.models.user;
  const scope = {
    async cleanSocket(socket) {
      assign(socket, {
        credit: false,
        account: false,
        login: false
      });
      if (socket.login) {
        app.users[socket.account.id] = null;
        socket.leaveGroup(socket.account.id);
        socket.leaveGroup(`${socket.account.id}Private`);
      }
    },
    async logout(request) {
      const {
        response,
        socket,
      } = request;
      socket.logout();
      if (socket.login) {
        try {
          await thinkyR.table('credit')
            .filter({
              accountID: socket.account.id,
            })
            .delete()
            .run();
        } catch (err) {
          console.log(err);
        }
      } else if (get('credit.id', socket)) {
        try {
          await thinkyR.table('credit')
            .get(socket.credit.id)
            .delete()
            .run();
        } catch (err) {
          console.log(err);
        }
      }
      if (response) {
        response.data = {};
        response.data.logout = true;
        response.data.auth = false;
      }
      scope.cleanSocket(socket);
    },
    async authorize(request) {
      try {
        const {
          response,
          socket,
        } = request;
        console.log(`authorize ${stringify(socket.credit)}`);
        response.data.loginStatus = true;
        socket.account = {
          id: socket.credit.accountID,
          ip: socket.ip,
        };
        socket.login = true;
        await socket.joinGroup(socket.account.id);
        await socket.joinGroup(`${socket.account.id}Private`);
        await socket.setup();
        const user = await thinkyR.table('user')
          .get(socket.account.id)
          .pluck('username', 'id', 'email', 'auth', 'role', 'admin')
          .run()
          .error((error) => {
            console.log(error);
            return false;
          });
        if (user) {
          assign(socket.account, user);
          await app.model.addon.updatePacks(socket);
          socket.account.auth.file = new RegExp(user.auth.file.join('|'), 'm');
          console.log(`Auth Type`, socket.account);
          socket.push('client', {
            item: user,
          });
          socket.onLogout('logout', scope.cleanSocket);
          app.users[socket.account.id] = socket;
          return true;
        }
      } catch (error) {
        console.log(error, 'Authorize');
      }
    },
    async verifyCredit(request) {
      const {
        body,
        socket,
      } = request;
      console.log(`verifyCredit ${stringify(body.credit)}`);
      let credit;
      try {
        credit = await app.model.credit
          .verify(body.credit, socket);
      } catch (error) {
        return scope.logout(request);
      }
      if (credit) {
        console.log(`Credit valid ${credit.username}`);
        socket.credit = credit;
        const user = await thinkyR.table('user')
          .get(credit.accountID)
          .run();
        if (!user) {
          await scope.logout(request);
          return socket.killSocket('False Credits');
        }
        scope.assignAccount(socket, user);
        await scope.authorize(request);
        return true;
      }
      console.log('failure on credit check');
      await scope.logout(request);
      return false;
    },
    async createCredit(request) {
      const {
        response,
        socket,
      } = request;
      console.log(`Issued new credits ${stringify(socket.account)}`);
      if (socket.account && socket.account.id) {
        await thinkyR.table('credit')
          .filter({
            accountID: socket.account.id,
          })
          .delete()
          .run();
      }
      const credit = await app.model.credit
        .create(socket.account)
        .catch((error) => {
          console.log(error);
          return error;
        });
      console.log(credit);
      response.data.credit = credit;
      socket.credit = credit;
      await scope.authorize(request);
      return credit;
    },
    async createdUser(request) {
      const {
        socket,
      } = request;
      console.log(`Created user ${stringify(socket.account)}`);
    },
    async createUser(body) {
      console.log(`Creating user ${stringify(body)}`);
      body.auth = {
        file: '',
      };
      const newUser = new UserScheme({
        username: body.username,
        email: body.email,
        password: body.password,
        referrer: body.referrer,
        auth: {
          file: [],
        },
        role: 'user',
        addons: ['free'],
      });
      return newUser.save();
    },
    hashKey(key) {
      return scrypt.kdf(key, {
        N: 1,
        r: 1,
        p: 1,
      });
    },
    checkPass(kdfResult, password) {
      return scrypt.verifyKdf(Buffer.from(kdfResult, 'base64'), new Buffer(password));
    },
    assignAccount(socket, user) {
      socket.account = {
        id: user.id,
        username: user.username,
        email: user.email,
        ip: socket.ip,
      };
    },
    async createAccount(request) {
      const {
        body,
        response,
        socket,
      } = request;
      if (!body.password || !body.password.length) {
        response.data.message = 'Supply a password';
        return;
      } else if (!body.username || !body.username.length) {
        response.data.message = 'Supply a username';
        return;
      } else if (!body.email) {
        response.data.message = 'Supply an email';
        return;
      }
      const emailCheck = validator.validate(body.email);
      let passwordHashed;
      if (!emailCheck) {
        console.log('Email is not valid');
        response.data.error = 'Email is not valid';
        return;
      }
      try {
        passwordHashed = await scope.hashKey(body.password);
      } catch (err) {
        return socket.killSocket('Password hash is broken');
      }
      body.password = passwordHashed.toString('base64');
      const user = await scope.createUser(body);
      console.log(user);
      scope.assignAccount(socket, user);
      await app.model.addon.setPlan(socket, ['free']);
      await scope.createCredit(request);
      await thinkyR.table('stats')
        .insert({
          id: user.id,
        })
        .run();
    },
    async signup(request) {
      const {
        body,
        response,
        socket,
      } = request;
      if (body.password) {
        body.password = body.password.trim();
      } else {
        response.data.message = 'Supply a password';
        return;
      }
      const userObject = {
        username: body.username,
      };
      if (body.email) {
        body.email = body.email.trim();
      }
      const userCheck = await thinkyR.table('user')
        .filter(userObject)
        .run();
      if (userCheck.length) {
        const user = userCheck[0];
        console.log(user.username, ' Signing in');
        const passwordCheck = await scope.checkPass(user.password, body.password);
        if (passwordCheck) {
          console.log('Keys correct', passwordCheck);
          scope.assignAccount(socket, user);
          await scope.createCredit(request);
        } else {
          console.log(user.username, `Password is false`);
          response.data.message = 'Login failed';
        }
      } else if (body.email) {
        body.username = body.username.trim().toLowerCase();
        await scope.createAccount(request);
      } else {
        response.data.message = 'Login failed';
      }
    }
  };
  app.model.user = scope;
  const userApi = {
    async logout(request) {
      const {
        response,
        socket,
      } = request;
      await scope.logout(request);
      socket.send(response);
    },
    async verify(request) {
      const {
        body,
      } = request;
      let callback;
      if (body.username && body.password) {
        callback = scope.signup;
      } else if (body.credit) {
        callback = scope.verifyCredit;
      } else {
        callback = scope.logout;
      }
      return callback(request);
    },
  };
  api.extend(userApi, {
    prefix: 'user'
  });
  require('./extend')(app);
};
