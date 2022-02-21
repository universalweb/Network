const utility = require('Lucy');
const buildConfig = require('../config');
const cluster = require('cluster');
const {
	assign, ifInvoke, promise, eachAsync, right
} = utility;
const dirName = `${__dirname}`.split('system/setup/app')[0];
const dirRoot = `${dirName}system/`;
const setupApps = async () => {
	const {
		service, masterMode
	} = utility;
	const type = masterMode ? 'master/' : 'client/';
	const dirApp = `${dirName}apps/${type}`;
	console.log(`Loading Application Directory: ${dirApp}`);
	console.log(
		`${
			masterMode ?
				'Master Applications Initializing' :
				'Client Applications Initializing'
		}`,
	);
	const apps = await utility.shallowRequire(dirApp);
	if (!apps.length) {
		if (masterMode) {
			require('../cluster/master')(utility);
		}
		return;
	}
	const ports = [];
	const compiledApps = [];
	const servers = {};
	const socketServers = {};
	const createdServer = service.http.createdServer;
	const serverTimeoutDefault = 60000;
	const setupServer = async (app, portNumber) => {
		let server;
		let socketServer;
		if (servers[portNumber]) {
			server = servers[portNumber];
		} else {
			await promise((accept) => {
				if (app.config.http.certs) {
					console.log('ENCRYPTED CONTEXT');
					server = service.http.createdServerSecure.listen(portNumber, accept);
				} else {
					server = createdServer.listen(portNumber, accept);
				}
				servers[portNumber] = server;
			});
			server.timeout =
				utility.http.connectionTimeout || serverTimeoutDefault;
			server.on('timeout', (socket) => {
				socket.end(`HTTP/1.1 400 OK\r\nConnection: close\r\n\r\n`);
				socket.destroy();
			});
			console.log(`Webserver Listening on ${portNumber}`);
		}
		if (socketServers[portNumber]) {
			socketServer = socketServers[portNumber];
		} else {
			socketServer = service.socket.create(server, portNumber);
			socketServers[portNumber] = socketServer;
			console.log(`Websocket server Listening on ${portNumber}`);
		}
		return {
			server,
			socketServer,
		};
	};
	const extendNetworkMethods = async (app) => {
		const namespace = app.config.name;
		const socketServer = app.socketServer;
		app.sendAll = (sendDataArg, endPoint = 'api') => {
			let sendData = sendDataArg;
			if (!sendData.data) {
				sendData = {
					data: sendDataArg,
				};
			}
			socketServer.to(namespace).emit(endPoint, sendData);
		};
	};
	const constructAppObject = async (appIndex) => {
		const app = {
			client: {},
			config: await appIndex.module(),
			controller: {},
			model: {},
			scheme: {},
			service,
			system: {},
			utility,
			view: {},
		};
		const {
			config
		} = app;
		require('../../../../utilities/crypto')(app);
		require('../../../../utilities/file')(app);
		require('../../../../utilities/console')(app);
		require('../../../../utilities/certificate')(app);
		require('../../../../utilities/certificates')(app);
		assign(config, {
			directory: appIndex.directory,
		});
		await buildConfig(app);
		console.log(
			`Compile app object for ${right(config.directory.split('/'), 1)}`,
		);
		require(masterMode ? '../cluster/master' : '../cluster/worker')(app);
		service.socket.addDomain(app);
		assign(service.http.secureContext, config.http.certs);
		const serverPort = config.http.port;
		assign(app, await setupServer(app, serverPort));
		await extendNetworkMethods(app);
		console.log('Load App filesystem', `${dirRoot}filesystem/`);
		await require(`${dirRoot}filesystem/`)(app);
		ports.push(config.http.port);
		compiledApps.push(app);
		console.log(`onStart ${config.name}`);
		await ifInvoke(config.onStart);
		console.log(`${app.config.name} Compiled & Started \n`);
	};
	await eachAsync(apps, async (item) => {
		if (item.directory.includes('!')) {
			console.log('IGNORE FOLDER', item);
			return false;
		} else {
			return constructAppObject(item);
		}
	});
	return {
		apps: compiledApps,
		ports,
		servers,
	};
};
module.exports = async (configType) => {
	assign(utility, configType);
	utility.service = {};
	console.log('startSetup');
	await require('../plugin')(utility);
	await require('../service')(utility);
	await setupApps();
	if (!cluster.isMaster) {
		process.send({
			cmd: 'finished'
		});
	}
	console.log('\n---------------------WORKER CLIENT SETUP ENDED---------------------\n');
};
