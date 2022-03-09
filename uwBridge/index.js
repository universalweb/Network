const utility = require('Acid');
const websocketSever = require('socket.io');
const {
	resolve
} = require('path');
const express = require('express');
const http = require('http');
const https = require('https');
const serverApp = express();
const oneInt = 1;
const zeroInt = 0;
const {
	assign,
	promise,
	construct,
	isPlainObject,
	each,
	ifInvoke,
	right,
	stringify,
	isFunction,
	hasValue,
	eachObject,
	eachAsync
} = utility;
const root = __dirname;
const systemDirectory = resolve(root, './system/');
const cryptoUtility = require('../utilities/crypto');
const fileUtility = require('../utilities/file');
const consoleUtility = require('../utilities/console');
const certificateUtility = require('../utilities/certificate');
const certificatesUtility = require('../utilities/certificates');
class uwBridge {
	utility = utility;
	serverTimeoutDefault = 60000;
	config = {};
	client = {
		socketEvent: {}
	};
	controller = {};
	model = {};
	scheme = {};
	system = {};
	serverApp = serverApp;
	express = express;
	createWebSocketServer() {
		const {
			config: {
				socket: {
					allowedOrigins
				}
			}
		} = this;
		const socketServer = websocketSever(this.server, {
			transports: ['websocket']
		});
		this.socketServer = socketServer;
		socketServer.use((socket, next) => {
			const host = socket.request.headers.host;
			console.log(host, allowedOrigins.test(host));
			if (allowedOrigins.test(host)) {
				return next();
			} else {
				this.killSocket({
					error: `No Host API ${host}`,
				}, socket);
				return next(new Error('No Host API'));
			}
		});
		socketServer.on('connection', (socket) => {
			return this.onSocketConnect(socket);
		});
		socketServer.push = async (endPoint, data, to) => {
			data.type = endPoint;
			return socketServer.to(to).emit('api', {
				data,
			});
		};
		return socketServer;
	}
	async getAPI(body, socket, requestProperty, response) {
		const {
			client
		} = this;
		const responseFunction = client[requestProperty];
		const rootPropertyString = requestProperty.substring(zeroInt, requestProperty.indexOf('.'));
		const rootObject = client[rootPropertyString];
		console.log(rootPropertyString, rootObject);
		if (responseFunction) {
			const securityMain = rootObject;
			const security = responseFunction.security;
			if (this.debug) {
				console.log('Security', Boolean(securityMain), Boolean(security));
			}
			const request = {
				body,
				response,
				send(dataArg) {
					return this.requestSend(dataArg, response, socket);
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
			return this.killSocket({
				error: `Invalid property entered. Attack made. ${requestProperty}`,
			}, socket);
		}
	}
	isRequestValid(rawRequestData, socket) {
		if (!socket.clientValid) {
			return false;
		}
		if (!rawRequestData) {
			return this.killSocket({
				error: 'requestData empty',
			}, socket);
		}
		const {
			request, id, data
		} = rawRequestData;
		if (!request) {
			return this.killSocket({
			  error: `Missing request ${stringify(rawRequestData)} ${rawRequestData.request
				}`,
			}, socket);
		} else if (id) {
			console.log(id, rawRequestData.request);
			this.getAPI(data, socket, request, {
				data: {},
				id,
			});
		} else {
			console.log(request);
			this.getAPI(data, socket, request, {
				data: {},
			});
		}
	}
	socketValidate = async (socket) => {
		socket.clientValid = true;
		socket.on('api', (requestData) => {
			this.isRequestValid(requestData, socket);
		});
		socket.on('configure', (requestData) => {
			console.log('CONFIGURE', requestData);
			const clientLanguage = requestData.language;
			let language;
			if (clientLanguage && this.languages[clientLanguage]) {
				language = clientLanguage;
			} else {
				language = 'enus';
			}
			socket.emit('ready', {
				language,
			});
		});
	};
	async onSocketConnect(socket) {
		if (socket) {
			console.log(this.client, this.client.socketEvent);
			if (!this.client.socketEvent) {
				return socket.disconnect(true);
			}
			console.log('onConnect', socket.id);
			await this.socketValidate(socket);
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
				if (!this.client.socketEvent) {
					socket.disconnect();
				}
				await this.client.socketEvent.joinGroup(socket, ...args);
			};
			socket.leaveGroup = async (endPoint) => {
				if (!endPoint) {
					return;
				}
				socket.groups.splice(socket.groups.indexOf(endPoint), oneInt);
				await this.client.socketEvent.leaveGroup(socket, endPoint);
				await promise((accept) => {
					socket.leave(endPoint, accept);
				});
			};
			socket.on('disconnect', async () => {
				if (!this.client.socketEvent) {
					socket.disconnect();
				}
				this.client.socketEvent.disconnect(socket);
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
				socket.send = null;
				socket.push = null;
				socket.ip = null;
				socket.onExitListeners = null;
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
			console.log('JOIN GROUP INIT', this.config.name);
			await socket.joinGroup(this.config.name);
			console.log('SOCKET EVENT CONNECT INIT');
			await this.client.socketEvent.connect(socket).catch((error) => {
				this.killSocket({
					error,
				}, socket);
			});
			socket.emit('configure', {});
		}
	}
	service = {
		http: {},
		socket: {}
	};
	view = {};
	events = {
		initialize: [() => {
			console.log(`\n--------------------- Initialize ${this.appName} ---------------------\n`);
		}],
		initialized: [() => {
			console.log(`\n--------------------- Initialized ${this.appName} ---------------------\n`);
		}]
	};
	on(eventNames, callback, sourceArray, arrayLength, thisBindArg) {
		const thisBind = thisBindArg || this;
		if (isPlainObject(eventNames) && !callback) {
			return each(eventNames, thisBind.on, thisBind);
		}
		return thisBind.events[eventNames].push(callback);
	}
	httpCreate() {
		const {
			config
		} = this;
		if (config.http?.certs?.key) {
			this.createdServer = https.createServer(config.http.certs, serverApp);
		} else {
			this.createdServer = http.createServer(serverApp);
		}
		serverApp.disable('x-powered-by');
		console.log('http service');
	}
	constructor(config) {
		return promise(async (accept) => {
			assign(this.config, config);
			await this.compileDirectories(this);
			console.log(config);
			require('./system/setup/plugin/directory/')(this);
			require('./system/setup/plugin/watch/')(this);
			cryptoUtility(this);
			fileUtility(this);
			consoleUtility(this);
			certificateUtility(this);
			certificatesUtility(this);
			await this.initialization();
			accept(this);
		});
	}
	compileDirectories() {
		const {
			utility: {
				last,
				compact
			},
			config: {
				directory,
			},
			config
		} = this;
		console.log(`Generating Config: ${config.appName}`);
		this.namespace = config.appName;
		config.root = directory;
		console.log(directory);
		config.appFolder = last(compact(directory.split('/')));
		config.apiDir = resolve(directory, `./api/`);
		config.apiClientDir = resolve(config.apiDir, `./client/`);
		config.apiSystemDir = resolve(config.apiDir, `./system/`);
		config.siteDir = resolve(directory, `./filesystem/`);
		config.publicDir = resolve(config.siteDir, `./public/`);
		config.resourceDir = resolve(directory, `./filesystem/asset/`);
		config.http.indexLocation = resolve(config.siteDir, `./public/index.html`);
		config.http.indexErrorLocation = resolve(config.siteDir, `./public/error.html`);
	}
	// Add a gaurante to sendAll as well as raw sendAll
	sendAll(sendDataArg, endPoint = 'api') {
		let sendData = sendDataArg;
		if (!sendData.data) {
			sendData = {
				data: sendDataArg,
			};
		}
		this.socketServer.to(this.namespace).emit(endPoint, sendData);
	}
	requestSend(dataArg, response, socket) {
		let data;
		if (dataArg) {
			data = assign({}, response);
			data.data = dataArg;
			console.log(data);
		} else {
			data = response;
		}
		return socket.send(data);
	}
	async killSocket(data, socket) {
		console.log('Websocket KILL START', socket.id, data?.error);
		await this.client.socketEvent.kill(data, socket);
		socket.clientValid = false;
		socket.removeAllListeners();
		socket.disconnect(true);
		console.log('Websocket KILL END', socket.id, data?.error);
	}
	async initialization() {
		const {
			config
		} = this;
		console.log(`Compile app object for ${right(config.directory.split('/'), 1)}`);
		await this.httpCreate();
		console.log('Load App filesystem', resolve(systemDirectory, './filesystem/'));
		await require(resolve(systemDirectory, './filesystem/'))(this);
		await this.setupServer();
		console.log(`onStart ${config.appName}`);
		await ifInvoke(config.onStart);
		console.log(`${config.appName} Compiled & Started \n`);
		return this;
	}
	async setupServer() {
		const {
			config: {
				http: {
					port
				}
			},
		} = this;
		await promise((accept) => {
			this.server = this.createdServer.listen(port, accept);
		});
		this.server.timeout = this.config.http.connectionTimeout;
		this.server.on('timeout', (socket) => {
			socket.end(`HTTP/1.1 400 OK\r\nConnection: close\r\n\r\n`);
			socket.destroy();
		});
		console.log(`Webserver Listening on ${port}`);
		this.createWebSocketServer();
		console.log(`Websocket server Listening on ${port}`);
	}
}
module.exports = async function(config) {
	return construct(uwBridge, [config]);
};

