module.exports = async function ($, client) {
  const {
    thinky,
    thinkyR,
    assign,
    isEmpty
  } = app;
  const scope = $('friend');
  const thisView = client.friend;
  const friendModel = thinky.models.friend;
  assign(thisView, {
    async accept(request) {
      const {
        body,
        socket,
        response,
      } = request;
      const checkRelationship = await scope.hasRelationship(body.item.from, socket);
      if (!checkRelationship) {
        return;
      }
      await scope.updateRelationship(body.item.from, socket, {
        status: 1,
      });
      const newTeam = new friendModel({
        to: body.item.from,
        from: socket.account.id,
        status: 1,
      });
      const team = await newTeam.save();
      response.data.item = team;
    },
    async decline(request) {
      const {
        body,
        socket,
      } = request;
      const relationshipCheck = await scope.hasRelationship(body.item.from, socket);
      if (!relationshipCheck) {
        return;
      }
      await scope.updateRelationship(body.item.from, socket, {
        status: 2,
      });
    },
    async create(request) {
      const {
        body,
        socket,
        response,
      } = request;
      let results = await thinkyR.table('friend')
        .filter({
          from: socket.account.id,
          to: body.item.to,
        });
      if (!isEmpty(results)) {
        return;
      }
      const newFriend = new friendModel({
        from: socket.account.id,
        to: body.item.to,
        status: 0,
      });
      results = await newFriend.save();
      response.data.relationship = results;
    },
    async delete(request) {
      const {
        body,
        socket,
        response,
      } = request;
      const id = (body.item.from === socket.account.id) ? body.item.to : body.item.from;
      await thinkyR.table('friend')
        .filter(doc => doc('from')
          .eq(id)
          .and(doc('to')
            .eq(socket.account.id))
          .or(doc('from')
            .eq(socket.account.id)
            .and(doc('to')
              .eq(id))))
        .delete()
        .run();
      response.data.status = 0;
    },
    async add(request) {
      const {
        body,
        response,
        socket,
      } = request;
      let user;
      if (body.item.userId) {
        user = await scope.getFriendInfo(body.item.userId);
      } else {
        const usernameSearch = await thinkyR.table('user')
          .getAll(body.item.username, {
            index: 'username',
          })
          .pluck(['username', 'id'])
          .run();
        user = usernameSearch[0];
      }
      if (user) {
        if (user.id === socket.account.id) {
          response.data.status = 2;
          return;
        }
        const relationshipCheck = await scope.hasRelationship(user.id, socket);
        if (!relationshipCheck) {
          request.body.item = {
            to: user.id,
          };
          await thisView.create(request);
          response.data.status = 1;
        }
      }
    }
  });
};
