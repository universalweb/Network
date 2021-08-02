module.exports = async function ($) {
  const {
    each,
    ifInvoke,
    isFunction,
    ensureArray,
    r,
    conn,
  } = app;

  function makeChangeFeed(data, changeFeed) {
    const filterMethod = data.filter;
    const security = data.security;
    const filterMethodObject = data.filterObject;
    return async function (err, item) {
      if (err) {
        console.log(err);
        return;
      }
      if (!item) {
        console.log('noItem');
        return;
      }
      if (item.state) {
        console.log(data.table, 'changes', item);
        ifInvoke(data[item.state], item);
      } else {
        const oldVal = item.old_val,
          newVal = item.new_val,
          funct = data[item.type];
        let sockets;
        console.log(data.table, item.type);
        if (filterMethod) {
          sockets = ensureArray(await filterMethod(oldVal, newVal));
        } else if (filterMethodObject) {
          sockets = filterMethodObject(oldVal, newVal);
        } else {
          sockets = changeFeed.watchers;
        }
        if (funct && sockets) {
          each(sockets, async (socket) => {
            if (socket && socket.push) {
              if (security) {
                const securityCheck = await security({
                  socket
                });
                if (securityCheck) {
                  console.log('Change Feed security', socket.account, securityCheck, data.table);
                  return;
                }
              }
              funct(socket, oldVal, newVal);
            }
          });
        }
      }
    };
  }
  $.changes = function (data) {
    return (async function () {
      const uuid = Symbol(data.table);
      let query;
      if (data.rawQuery) {
        query = data.rawQuery();
        console.log(query);
      } else {
        query = r.table(data.table)
          .changes({
            includeInitial: false,
            includeStates: true,
            squash: false,
            includeTypes: true,
          });
      }
      const changeFeed = {
        watchers: {},
        watch(name, socket, removeOnLogout) {
          if (!socket.onExit[uuid]) {
            changeFeed.watchers[name] = socket;
            socket.onExit(uuid, () => {
              changeFeed.unwatch(name, socket);
            });
            if (removeOnLogout) {
              socket.onLogout(uuid, () => {
                console.log(data.table, 'onLogout');
                changeFeed.unwatch(name, socket);
              });
            }
          }
        },
        unwatch(name, socket) {
          changeFeed.watchers[name] = null;
          socket.onExit[uuid] = null;
        },
      };
      if (data.query) {
        query = data.query(query);
      }
      each(data, (item, key) => {
        if (isFunction(item)) {
          data[key] = item.bind(changeFeed);
        }
      });
      const changeType = makeChangeFeed(data, changeFeed);
      await query.run(conn, (err, cursor) => {
        if (err) {
          console.log(err, 'error');
          return;
        }
        if (changeFeed.close) {
          return cursor.close();
        }
        cursor.each(changeType);
      });
      return changeFeed;
    })();
  };
};
