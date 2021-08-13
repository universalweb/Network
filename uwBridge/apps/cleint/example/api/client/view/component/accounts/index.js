module.exports = async (app) => {
  const {
    thinkyR,
    changes,
    socketServer,
    api
  } = app;
  const clientView = {
    async create(request) {
      const {
        body,
        socket,
      } = request;
      const proxy = body.item.proxy;
      const account = body.item.account;
      console.log(body.item);
      if (!body.item.title || !body.item.title.length) {
        return;
      }
      await thinkyR.table('account')
        .insert({
          accountID: socket.account.id,
          title: body.item.title.trim(),
          network: body.item.network.trim(),
          account: {
            username: account.username.trim(),
            password: account.password.trim(),
          },
          proxy: {
            ip: proxy.ip.trim(),
            port: proxy.port.trim(),
            username: proxy.username.trim(),
            password: proxy.password.trim(),
            ipVersion: proxy.ipVersion.trim(),
          },
          created: thinkyR.now()
        })
        .run();
    },
    async read(request) {
      const {
        body,
        response,
        socket,
      } = request;
      const skip = body.page ? body.page * 25 : 0;
      const results = await thinkyR.table('account')
        .filter({
          accountID: socket.account.id
        })
        .skip(skip)
        .limit(25)
        .run();
      response.data.items = results;
      request.send();
    },
    async update(request) {
      const {
        body,
        socket,
      } = request;
      const proxy = body.item.proxy;
      const account = body.item.account;
      console.log(body.item);
      if (!body.item.id || !body.item.id.length) {
        return;
      }
      if (!body.item.title || !body.item.title.length) {
        return;
      }
      await thinkyR.table('account')
        .filter({
          id: body.item.id,
          accountID: socket.account.id
        })
        .update({
          title: body.item.title.trim(),
          network: body.item.network.trim(),
          account: {
            username: account.username.trim(),
            password: account.password.trim(),
          },
          proxy: {
            ip: proxy.ip.trim(),
            port: proxy.port.trim(),
            username: proxy.username.trim(),
            password: proxy.password.trim(),
            ipVersion: proxy.ipVersion.trim(),
          },
          created: thinkyR.now()
        })
        .run();
    },
    async delete(request) {
      const {
        body,
        socket,
      } = request;
      await thinkyR.table('account')
        .filter({
          id: body.item.id,
          accountID: socket.account.id,
        })
        .delete()
        .run();
    }
  };
  await changes({
    async change(oldVal, newVal) {
      socketServer.push('account.update', {
        item: newVal
      }, newVal.accountID);
    },
    async add(newVal) {
      socketServer.push('account.create', {
        item: newVal
      }, newVal.accountID);
    },
    async remove(oldVal) {
      socketServer.push('account.delete', {
        item: oldVal
      }, oldVal.accountID);
    },
    table: 'account',
  });
  api.extend(clientView, {
    prefix: 'account'
  });
};
