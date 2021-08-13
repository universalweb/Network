module.exports = async (app) => {
  const {
    utility: {
      each,
      ifInvoke,
      isFunction,
      hasValue,
    },
    r,
    conn,
  } = app;
  function makeChangeFeed(data) {
    return async (err, item) => {
      if (err) {
        console.log(err);
      } else if (!item) {
        console.log('noItem');
      } else if (item.state) {
        console.log(data.table, 'changes', item);
        ifInvoke(data[item.state], item);
      } else {
        const oldVal = item.old_val;
        const newVal = item.new_val;
        const funct = data[item.type];
        if (funct && (oldVal || newVal)) {
          if (hasValue(oldVal)) {
            funct(oldVal, newVal);
          } else {
            funct(newVal);
          }
        }
      }
    };
  }
  app.changes = async (data) => {
    let query;
    if (data.rawQuery) {
      query = data.rawQuery();
    } else {
      query = r.table(data.table)
        .changes({
          includeInitial: false,
          includeStates: true,
          includeTypes: true,
          squash: false,
        });
    }
    const changeFeed = {};
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
  };
};
