module.exports = async function ($, client) {
  const {
    thinkyR,
    system,
    isEmpty,
    pluck,
    eachArray,
    ifInvoke,
    keys
  } = app;
  const namespace = system.config.name;
  const thisView = {};
  $.socketEvent = thisView;
  thisView.connect = async function (socket) {
    const userAgent = socket.request.headers['user-agent'];
    console.log(socket.ip, userAgent, 'Connected');
    await thinkyR.table('analytics')
      .insert({
        type: 'connected',
        ip: socket.ip,
        requestHeaders: pluck(socket.request.headers, [
          'host',
          'origin',
          'user-agent',
          'accept-language',
        ]),
        created: thinkyR.now(),
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
      const onLogoutArray = [];
      onLogoutArray.push(...Object.getOwnPropertySymbols(onLogoutMap));
      onLogoutArray.push(...keys(onLogoutMap));
      eachArray(onLogoutArray, (item) => {
        ifInvoke(onLogoutMap[item]);
        onLogoutMap[item] = null;
      });
    };
    socket.onExit(socket.id, socket.logout);
  };
  thisView.kill = async function (data, socket) {
    const contact = await thinkyR.table('analytics')
      .insert({
        type: 'kill',
        description: data.error,
        ip: socket.ip,
        requestHeaders: socket.request.headers,
        created: thinkyR.now(),
      })
      .run();
    console.log('Socket Killed', contact.ip);
  };
  thisView.joinGroup = async function (socket, name) {
    console.log(name, socket.id);
    const shouldUpdate = await thinkyR.table('group')
      .filter({
        name,
        socket: socket.id,
      })
      .run();
    if (!isEmpty(shouldUpdate)) {
      // console.log(shouldUpdate,'__________________________________________!');
      let item;
      const socketId = socket.id,
        accountID = socket.account.id,
        credit = socket.credit.id;
      while (shouldUpdate[0]) {
        item = shouldUpdate[0];
        await thinkyR.table('group')
          .update({
            id: item.id,
            name,
            socket: socketId,
            accountID,
            credit,
            created: thinkyR.now(),
          })
          .run();
        shouldUpdate.shift();
      }
    } else {
      await thinkyR.table('group')
        .insert({
          name,
          socket: socket.id,
          accountID: (socket.account) ? socket.account.id : false,
          credit: (socket.credit) ? socket.credit.id : false,
          created: thinkyR.now(),
        })
        .run();
    }
  };
  thisView.leaveGroup = async function (socket, name) {
    console.log('leaveGroup', name);
    await thinkyR.table('group')
      .filter({
        name,
        socket: socket.id,
      })
      .delete()
      .run();
  };
  thisView.disconnect = async function (socket, name) {
    await thinkyR.table('group')
      .filter({
        name,
        socket: socket.id,
      })
      .delete()
      .run();
  };
};
