module.exports = async (app) => {
  app.model.chat = {};
  const {
    thinkyR,
    changes,
    socketServer,
    api
  } = app;
  const chatApi = {
    async security(request) {
      return request.socket.login;
    },
    async create(request) {
      const {
        body,
        socket,
      } = request;
      await thinkyR.table('chat')
        .insert({
          from: socket.account.id,
          group: body.group,
          message: body.message.trim(),
          sent: thinkyR.now()
        })
        .run();
    },
    async delete(request) {
      const {
        body,
        socket,
      } = request;
      await thinkyR.table('chat')
        .filter({
          id: body.item.id,
          from: socket.account.id
        })
        .delete()
        .run();
    }
  };
  await changes({
    table: 'chat',
    async change(oldVal, newVal) {
      socketServer.push('chat.update', {
        item: newVal
      }, newVal.to);
      socketServer.push('chat.update', {
        item: newVal
      }, newVal.from);
    },
    async remove(oldVal) {
      socketServer.push('chat.delete', {
        item: oldVal
      }, oldVal.to);
      socketServer.push('chat.delete', {
        item: oldVal
      }, oldVal.from);
    },
    async add(newVal) {
      socketServer.push('chat.create', {
        item: newVal
      }, newVal.to);
      socketServer.push('chat.create', {
        item: newVal
      }, newVal.from);
    },
  });
  api.extend(chatApi, {
    prefix: 'chat'
  });
};
