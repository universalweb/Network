module.exports = async function ($, client) {
  const scrypt = require('scrypt');
  const validator = require('email-validator');
  const {
    stringify,
    assign,
    thinkyR,
    dbModel,
    eachAsync,
    directory,
    model
  } = app;
  const scope = $('user', {});
  const userModel = dbModel.user;
  const thisView = {};
  client.user = thisView;
  scope.logout = async function (request) {
    const {
      body,
      response,
      socket,
    } = request;
    console.log('Logout', body);
    socket.logout();
    if (socket.account && socket.account.id) {
      try {
        await thinkyR.table('credit')
          .filter({
            accountID: socket.account.id
          })
          .delete()
          .run();
      } catch (err) {
        console.log(err);
      }
    } else if (socket.credit && socket.credit.id) {
      try {
        await thinkyR.table('credit')
          .get(socket.credit.id)
          .delete()
          .run();
      } catch (err) {
        console.log(err);
      }
    }
    response.data = {};
    response.data.logout = true;
    response.data.auth = false;
    socket.credit = false;
    socket.account = false;
  };
  thisView.logout = async function (request) {
    const {
      response,
      socket,
    } = request;
    await scope.logout(request);
    socket.send(response);
  };
  scope.authorize = async function (request) {
    const {
      response,
      socket,
    } = request;
    console.log(`authorize ${stringify(socket.credit)}`);
    response.data.loginStatus = true;
    socket.account = {
      id: socket.credit.accountID,
      ip: socket.ip
    };
    await socket.joinGroup(socket.account.id);
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
      socket.account.auth.file = new RegExp(user.auth.file.join('|'), 'm');
      console.log(`Auth Type`, socket.account);
      socket.push('client', {
        item: user
      });
      return true;
    }
  };
  scope.verifyCredit = async function (request) {
    const {
      body,
      socket
    } = request;
    console.log(`verifyCredit ${stringify(body.credit)}`);
    let credit;
    try {
      credit = await $('credit')
        .verify(body.credit);
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
  };
  scope.createCredit = async function (request) {
    const {
      response,
      socket,
    } = request;
    console.log(`Issued new credits ${stringify(socket.account)}`);
    if (socket.account && socket.account.id) {
      await thinkyR.table('credit')
        .filter({
          accountID: socket.account.id
        })
        .delete()
        .run();
    }
    const credit = await $('credit')
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
  };
  scope.createdUser = function (request) {
    const {
      socket,
    } = request;
    console.log(`Created user ${stringify(socket.account)}`);
  };
  scope.createUser = (body) => {
    console.log(`Creating user ${stringify(body)}`);
    body.auth = {
      file: ''
    };
    const newUser = new userModel({
      username: body.username,
      email: body.email,
      password: body.password,
      auth: {
        file: []
      },
      role: 'user'
    });
    return newUser.save();
  };
  scope.hashKey = (key) => {
    return scrypt.kdf(key, {
      N: 1,
      r: 1,
      p: 1
    });
  };
  scope.checkPass = (kdfResult, password) => {
    return scrypt.verifyKdf(Buffer.from(kdfResult, 'base64'), new Buffer(password));
  };
  scope.assignAccount = function (socket, user) {
    socket.account = {
      id: user.id,
      username: user.username,
      email: user.email,
      ip: socket.ip
    };
  };
  scope.createAccount = async function (request) {
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
    const user = await scope.createUser(body, socket);
    scope.assignAccount(socket, user);
    await scope.createCredit(request);
    await thinkyR.table('stats')
      .insert({
        id: user.id
      })
      .run();
  };
  scope.signup = async function (request) {
    const {
      body,
      response,
      socket,
    } = request;
    if (!body.password) {
      response.data.message = 'Supply a password';
      return;
    } else {
      body.password = body.password.trim();
    }
    body.username = body.username.trim();
    const userObject = {
      username: body.username
    };
    if (body.email) {
      body.email = body.email.trim();
      userObject.email = body.email;
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
      } else if (!body.email) {
        response.data.message = 'Login failed';
      } else {
        console.log(user.username, `Password is ${passwordCheck}`);
        await scope.logout(request);
      }
    } else if(!body.email) {
      response.data.message = 'Login failed';
    } else {
      await scope.createAccount(request);
    }
  };
  thisView.verify = async function (request) {
    const {
      body,
    } = request;
    let callback;
    if (body.username && body.password) {
      callback = scope.signup;
    } else if (!body.credit) {
      callback = scope.logout;
    } else {
      callback = scope.verifyCredit;
    }
    await callback(request);
  };
  const models = await directory.shallowRequire(`${__dirname}`);
  await eachAsync(models, async(item) => {
    if (item && item.module) {
      await item.module($, client);
    }
  });
};
