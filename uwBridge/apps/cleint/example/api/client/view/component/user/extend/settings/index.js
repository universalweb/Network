module.exports = async (app) => {
  const validator = require('email-validator');
  const validate = require('validate.js');
  const {
    thinkyR,
    api,
    utility: {
      assign,
    }
  } = app;
  const scope = app.model.user;
  const constraints = {
    password: {
      presence: {
        message: 'Invalid password',
      },
      length: {
        minimum: 6,
        maximum: 64,
      },
    },
    username: {
      presence: true,
      length: {
        minimum: 3,
        maximum: 20,
      },
    },
  };
  const userSettingsApi = {
    async security(request) {
      return request.socket.login;
    },
    async read(request) {
      const {
        response,
        socket,
      } = request;
      const results = await thinkyR.table('user')
        .get(socket.account.id)
        .pluck('username', 'id', 'email', 'role', 'admin')
        .run();
      response.data.item = results;
      request.send();
    },
    async update(request) {
      const {
        body,
        socket,
        response,
      } = request;
      const user = await thinkyR.table('user')
        .get(socket.account.id)
        .pluck('password');
      const passwordCheck = await scope.checkPass(user.password, body.item.password);
      if (!passwordCheck) {
        console.log('Email is not valid');
        response.data.error = 'Email is not valid';
        return socket.send(response);
      }
      const email = body.item.email.trim();
      const username = body.item.username.trim();
      const emailCheck = validator.validate(body.item.email);
      if (!emailCheck) {
        console.log('Email is not valid');
        response.data.error = 'Email is not valid';
        return socket.send(response);
      }
      const usernameValidate = validate.single(body.item.username, constraints.username);
      if (usernameValidate) {
        response.data.error = usernameValidate[0];
        return socket.send(response);
      }
      await thinkyR.table('user')
        .get(socket.account.id)
        .update({
          username,
          email,
        })
        .run();
      const userUpdate = await thinkyR.table('user')
        .get(socket.account.id)
        .pluck('username', 'id', 'email', 'auth', 'role', 'admin')
        .run()
        .error((error) => {
          console.log(error);
          return false;
        });
      assign(socket.account, userUpdate);
      console.log(body.item, 'settings updated');
    },
    async password(request) {
      const {
        body,
        socket,
        response,
      } = request;
      const user = await thinkyR.table('user')
        .get(socket.account.id)
        .pluck('password');
      const passwordCheck = await scope.checkPass(user.password, body.item.password);
      if (!passwordCheck) {
        console.log('Email is not valid');
        response.data.error = 'Email is not valid';
        return socket.send(response);
      }
      let password;
      try {
        password = await scope.hashKey(body.item.password);
      } catch (err) {
        return socket.killSocket('Password hash is broken');
      }
      const passwordValidate = validate.single(body.item.username, constraints.username);
      if (passwordValidate) {
        response.data.error = passwordValidate[0];
        return socket.send(response);
      }
      await thinkyR.table('user')
        .get(socket.account.id)
        .update({
          password,
        })
        .run();
    }
  };
  api.extend(userSettingsApi, {
    prefix: 'settings'
  });
};
