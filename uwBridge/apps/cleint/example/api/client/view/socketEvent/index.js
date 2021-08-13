module.exports = async (app) => {
  const {
    thinkyR,
    config,
    utility: {
      isEmpty,
      pluck,
      eachArray,
      ifInvoke,
      eachAsync
    }
  } = app;
  const namespace = config.name;
  const socketEventApi = {
    async connect(socket) {
      const userAgent = socket.request.headers['user-agent'];
      console.log(socket.ip, userAgent, 'Connected');
      await thinkyR.table('analytics')
        .insert({
          created: thinkyR.now(),
          ip: socket.ip,
          requestHeaders: pluck(socket.request.headers, [
            'host',
            'origin',
            'user-agent',
            'accept-language',
          ]),
          type: 'connected',
        })
        .run();
      socket.join(namespace);
      const onLogoutMap = {};
      socket.onLogout = (key, item) => {
        if (!onLogoutMap[key]) {
          onLogoutMap[key] = item;
        }
      };
      socket.logout = () => {
        eachArray(onLogoutMap, (item) => {
          ifInvoke(onLogoutMap[item], socket);
          onLogoutMap[item] = null;
        });
      };
      socket.onExit(socket.id, socket.logout);
    },
    async disconnect(socket, endPoint) {
      await thinkyR.table('group')
        .filter({
          name: endPoint,
          socket: socket.id,
        })
        .delete()
        .run();
    },
    async joinGroup(socket, endPoint) {
      console.log(endPoint, socket.id);
      const shouldUpdate = await thinkyR.table('group')
        .filter({
          name: endPoint,
          socket: socket.id,
        })
        .run();
      if (isEmpty(shouldUpdate)) {
        await thinkyR.table('group')
          .insert({
            accountID: (socket.account) ? socket.account.id : false,
            created: thinkyR.now(),
            name: endPoint,
            socket: socket.id,
            status: true,
          })
          .run();
      } else {
        const socketId = socket.id;
        const accountID = socket.account.id;
        eachAsync(shouldUpdate, async (item) => {
          await thinkyR.table('group')
            .update({
              accountID,
              created: thinkyR.now(),
              id: item.id,
              name: endPoint,
              socket: socketId,
              status: true,
            })
            .run();
        });
      }
    },
    async kill(data, socket) {
      const contact = await thinkyR.table('analytics')
        .insert({
          created: thinkyR.now(),
          description: data.error,
          ip: socket.ip,
          requestHeaders: socket.request.headers,
          type: 'kill',
        })
        .run();
      console.log('Socket Killed', contact.ip);
    },
    async leaveGroup(socket, endPoint) {
      console.log('leaveGroup', endPoint);
      await thinkyR.table('group')
        .filter({
          name: endPoint,
          socket: socket.id,
        })
        .delete()
        .run();
    },
  };
  app.client.socketEvent = socketEventApi;
};
