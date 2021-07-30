module.exports = (utility) => {
  const socketio = require('socket.io');
  const WebSocketServer = require('uws')
    .Server;
  const {
    each,
    eachObject,
    ifInvoke,
    promise,
    assign,
    eachAsync,
    stringify
  } = utility;
  const requestSend = async (dataArg, response, socket) => {
    let data;
    if (dataArg) {
      data = assign({}, response);
      data.data = dataArg;
    } else {
      data = response;
    }
    socket.send(data);
  };
  const availableHosts = {};
  const oneInt = 1;
  const zeroInt = 0;
  const killSocket = (data, socket) => {
    socket.clientValid = false;
    socket.emit('disconnect');
    socket.removeAllListeners();
    socket.disconnect(true);
    console.log('Websocket Attack', data.error);
  };
  const getAPI = async (body, socket, requestProperty, response) => {
    console.log(requestProperty);
    const hostAPI = socket.hostAPI;
    const responseFunction = hostAPI[requestProperty];
    const rootPropertyString = requestProperty.substring(zeroInt, requestProperty.indexOf('.'));
    const rootObject = hostAPI[rootPropertyString];
    if (responseFunction) {
      const security = responseFunction.security || rootObject;
      const request = {
        body,
        response,
        async send(dataArg) {
          await requestSend(dataArg, response, socket);
        },
        socket,
      };
      let securityCheck;
      if (security) {
        try {
          securityCheck = await security(request);
          if (!securityCheck) {
            console.log('Security Check failed');
            return;
          }
        } catch (errr) {
          return console.log(errr);
        }
      }
      if (!response.id) {
        if (body.type) {
          response.data.type = body.type;
        } else {
          response.data.type = requestProperty;
        }
      }
      const results = responseFunction(request);
      if (results) {
        await results;
      }
      if (results && response.id) {
        socket.send(response);
      }
    } else {
      killSocket({
        error: 'Invalid property entered. Attack made.',
      }, socket);
    }
  };
  const isRequestValid = (rawRequestData, socket) => {
    if (!socket.clientValid) {
      return false;
    }
    if (!rawRequestData) {
      return killSocket({
        error: 'requestData empty',
      }, socket);
    }
    const {
      request,
      id,
      data
    } = rawRequestData;
    console.log(rawRequestData.request);
    if (!request) {
      killSocket({
        error: `Missing request ${stringify(rawRequestData)} ${rawRequestData.request}`,
      }, socket);
    }
    if (id) {
      getAPI(data, socket, request, {
        data: {},
        id,
      });
    } else {
      getAPI(data, socket, request, {
        data: {},
      });
    }
  };
  const socketIsValid = async (socket) => {
    socket.clientValid = true;
    socket.on('api', (requestData) => {
      isRequestValid(requestData, socket);
    });
    socket.emit('configure', {});
    socket.on('configure', (requestData) => {
      const clientLanguage = requestData.language;
      let language;
      if (clientLanguage && socket.app.languages[clientLanguage]) {
        language = clientLanguage;
      } else {
        language = 'enus';
      }
      socket.emit('ready', {
        language,
      });
    });
  };
  const onConnect = async (socket) => {
    if (socket) {
      socket.hostAPI.socketEvent.connect(socket).catch((error) => {
        killSocket({
          error
        }, socket);
      });
      await socketIsValid(socket);
      socket.ip = socket.request.websocket._socket.remoteAddress.replace('::ffff:', '');
      socket.groups = [];
      const onExitListeners = {};
      socket.onExit = (endPoint, funct) => {
        if (!funct) {
          return onExitListeners[endPoint];
        }
        onExitListeners[endPoint] = funct;
      };
      socket.joinGroup = async (...args) => {
        const endPoint = args[zeroInt];
        if (!endPoint) {
          return;
        }
        socket.groups.push(endPoint);
        await promise((accept) => {
          socket.join(endPoint, accept);
        });
        await socket.hostAPI.socketEvent.joinGroup(socket, ...args);
      };
      socket.leaveGroup = async (endPoint) => {
        if (!endPoint) {
          return;
        }
        socket.groups.splice(socket.groups.indexOf(endPoint), oneInt);
        await socket.hostAPI.socketEvent.leaveGroup(socket, endPoint);
        await promise((accept) => {
          socket.leave(endPoint, accept);
        });
      };
      socket.on('disconnect', async () => {
        socket.hostAPI.socketEvent.disconnect(socket);
        await socket.clean();
      });
      socket.clean = async () => {
        eachObject(onExitListeners, (item) => {
          ifInvoke(onExitListeners[item], socket);
          onExitListeners[item] = null;
        });
        await eachAsync(socket.groups, socket.leaveGroup);
        socket.account = null;
        socket.credit = null;
        socket.groups = null;
        socket.onExit = null;
        socket.clean = null;
        socket.leaveGroup = null;
        socket.joinGroup = null;
        socket.killSocket = null;
        socket.send = null;
        socket.push = null;
        socket.ip = null;
        socket.app = null;
        socket.hostAPI = null;
        socket.onExitListeners = null;
      };
      socket.killSocket = async (data) => {
        await socket.hostAPI.socketEvent.kill(data, socket);
        return killSocket(data, socket);
      };
      socket.send = async (data, endPoint = 'api') => {
        return socket.emit(endPoint || 'api', data);
      };
      socket.push = async (endPoint, data) => {
        data.type = endPoint;
        return socket.emit('api', {
          data,
        });
      };
      await socket.joinGroup(socket.app.config.name);
    }
  };
  const chooseDomainAPI = (server) => {
    server.use((socket, next) => {
      const host = socket.request.headers.host;
      console.log(host);
      if (host) {
        const app = availableHosts[host];
        if (app) {
          socket.hostAPI = app.client;
          socket.app = app;
          return next();
        } else {
          killSocket({
            error: `No Host API ${host}`,
          }, socket);
          return next(new Error('No Host API'));
        }
      } else {
        killSocket({
          error: 'No host header',
        }, socket);
        return next(new Error('No host header'));
      }
    });
  };
  utility.service.socket = {
    addDomain(app) {
      const domains = app.config.socket.allowedOrigins;
      each(domains, (domain) => {
        availableHosts[domain] = app;
      });
    },
    create(httpServer) {
      const server = socketio(httpServer);
      const engine = new WebSocketServer({
        clientTracking: false,
        noServer: true,
        perMessageDeflate: false,
      });
      server.engine.ws = engine;
      chooseDomainAPI(server);
      server.on('connection', onConnect);
      server.push = async (endPoint, data, to) => {
        data.type = endPoint;
        return server.to(to).emit('api', {
          data,
        });
      };
      return server;
    },
  };
  console.log('Socket service');
};