module.exports = (utility) => {
	const socketio = require('socket.io');
	const {
		each,
		eachObject,
		ifInvoke,
		promise,
		assign,
		eachAsync,
		stringify,
		isFunction,
		hasValue
	} = utility;
	const requestSend = async (dataArg, response, socket) => {
		let data;
		if (dataArg) {
			data = assign({}, response);
			data.data = dataArg;
			console.log(data);
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
		console.log('Websocket Attack', socket.id, data.error);
		socket.removeAllListeners();
		socket.disconnect(true);
	};
	const getAPI = async (body, socket, requestProperty, response) => {
		const hostAPI = socket.hostAPI;
		const responseFunction = hostAPI[requestProperty];
		const rootPropertyString = requestProperty.substring(zeroInt, requestProperty.indexOf('.'));
		const rootObject = hostAPI[rootPropertyString];
		console.log(rootPropertyString, rootObject);
		if (responseFunction) {
			const securityMain = rootObject;
			const security = responseFunction.security;
			if (utility.debug) {
				console.log('Security', Boolean(securityMain), Boolean(security));
			}
			const request = {
				body,
				response,
				send(dataArg) {
					return requestSend(dataArg, response, socket);
				},
				socket,
			};
			if (!response.id) {
				if (body.type) {
					response.data.type = body.type;
				} else {
					response.data.type = requestProperty;
				}
			}
			let securityCheck;
			if (isFunction(securityMain) && securityMain !== security) {
				try {
					securityCheck = await securityMain(request);
					if (securityCheck === false) {
						console.log('Main Security Check failed');
						return;
					}
				} catch (err) {
					return console.log(err);
				}
			}
			if (isFunction(security)) {
				try {
					securityCheck = await security(request);
					if (securityCheck === false) {
						console.log('Propertry Specific Security Check failed');
						return;
					}
				} catch (err) {
					return console.log(err);
				}
			}
			const results = await responseFunction(request);
			if (results && hasValue(response.id)) {
				socket.send(response);
			}
		} else {
			console.log('KILLING SOCKET', socket.id);
			killSocket({
				error: `Invalid property entered. Attack made. ${requestProperty}`,
			}, socket);
		}
	};
	const isRequestValid = (rawRequestData, socket) => {
		if (!socket.clientValid) {
			return false;
		}
		if (!rawRequestData) {
			return killSocket(
				{
					error: 'requestData empty',
				},
				socket,
			);
		}
		const {
			request, id, data
		} = rawRequestData;
		if (!request) {
			return killSocket({
				error: `Missing request ${stringify(rawRequestData)} ${rawRequestData.request
				}`,
			}, socket);
		} else if (id) {
			console.log(id, rawRequestData.request);
			getAPI(data, socket, request, {
				data: {},
				id,
			});
		} else {
			console.log(request);
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
		socket.on('configure', (requestData) => {
			console.log('CONFIGURE', requestData);
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
			if (!socket.hostAPI.socketEvent) {
				return socket.disconnect(true);
			}
			console.log('onConnect', socket.id);
			await socketIsValid(socket);
			socket.ip = socket.request.websocket._socket.remoteAddress.replace(
				'::ffff:',
				'',
			);
			socket.groups = [];
			const onExitListeners = {};
			socket.onExit = (endPoint, callback) => {
				console.log(endPoint, 'onExit');
				if (!callback) {
					return onExitListeners[endPoint];
				}
				onExitListeners[endPoint] = callback;
			};
			socket.joinGroup = async (...args) => {
				const endPoint = args[zeroInt];
				if (!endPoint) {
					console.log('JOIN GROUP BLANK');
					return;
				}
				socket.groups.push(endPoint);
				console.log('JOIN GROUP CALLBACK', endPoint);
				socket.join(endPoint);
				if (!socket.hostAPI.socketEvent) {
					socket.disconnect();
				}
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
				if (!socket.hostAPI.socketEvent) {
					socket.disconnect();
				}
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
			console.log('JOIN GROUP INIT', socket.app.config.name);
			await socket.joinGroup(socket.app.config.name);
			console.log('SOCKET EVENT CONNECT INIT');
			await socket.hostAPI.socketEvent.connect(socket).catch((error) => {
				killSocket(
					{
						error,
					},
					socket,
				);
			});
			socket.emit('configure', {});
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
				killSocket(
					{
						error: 'No host header',
					},
					socket,
				);
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
