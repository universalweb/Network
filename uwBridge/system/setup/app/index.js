const utility = require('Lucy');
const cluster = require('cluster');
const {
	resolve
} = require('path');
const {
	assign,
	ifInvoke,
	promise,
	eachAsync,
	right,
	assignDeep
} = utility;
const root = resolve(__dirname, '../../../');
const systemDirectory = resolve(root, './system/');
const cryptoUtility = require('../../../../utilities/crypto');
const fileUtility = require('../../../../utilities/file');
const consoleUtility = require('../../../../utilities/console');
const certificateUtility = require('../../../../utilities/certificate');
const certificatesUtility = require('../../../../utilities/certificates');
class UniversalApp {
	static serverTimeoutDefault = 60000;
	static ports = [];
	static compiledApps = [];
	static servers = {};
	static socketServers = {};
	config = {
		directory: {
			root,
			system: systemDirectory
		}
	};
	client = {};
	controller = {};
	model = {};
	scheme = {};
	system = {};
	utility = utility;
	view = {};
	constructor(configModule) {
		this.service = utility.service;
		cryptoUtility(this);
		fileUtility(this);
		consoleUtility(this);
		certificateUtility(this);
		certificatesUtility(this);
		this.config.directory = resolve(configModule._directory, '../');
		this.configModule = configModule;
		return this.initialization();
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
		console.log(`Generating Config: ${config.name}`);
		this.namespace = config.name;
		config.root = directory;
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
	async initialization() {
		const {
			service,
			masterThread
		} = this.utility;
		assignDeep(this.config, await this.configModule());
		const {
			config
		} = this;
		await this.compileDirectories(this);
		console.log(`Compile app object for ${right(config.directory.split('/'), 1)}`);
		require(masterThread ? '../cluster/master' : '../cluster/worker')(this);
		service.socket.addDomain(this);
		assign(service.http.secureContext, config.http.certs);
		await this.setupServer();
		console.log('Load App filesystem', resolve(systemDirectory, './filesystem/'));
		await require(resolve(systemDirectory, './filesystem/'))(this);
		UniversalApp.ports.push(config.http.port);
		UniversalApp.compiledApps.push(this);
		console.log(`onStart ${config.name}`);
		await ifInvoke(config.onStart);
		console.log(`${this.config.name} Compiled & Started \n`);
		return this;
	}
	async setupServer() {
		const {
			config: {
				http: {
					port
				}
			},
			utility: {
				service,
				service: {
					http: {
						createdServer
					}
				}
			}
		} = this;
		const servers = UniversalApp.servers;
		if (servers[port]) {
			this.server = servers[port];
		} else {
			await promise((accept) => {
				if (this.config.http.certs) {
					console.log('ENCRYPTED CONTEXT');
					this.server = service.http.createdServerSecure.listen(port, accept);
				} else {
					this.server = createdServer.listen(port, accept);
				}
				servers[port] = this.server;
			});
			this.server.timeout = utility.http.connectionTimeout || UniversalApp.serverTimeoutDefault;
			this.server.on('timeout', (socket) => {
				socket.end(`HTTP/1.1 400 OK\r\nConnection: close\r\n\r\n`);
				socket.destroy();
			});
			console.log(`Webserver Listening on ${port}`);
		}
		if (UniversalApp.socketServers[port]) {
			this.socketServer = UniversalApp.socketServers[port];
		} else {
			this.socketServer = service.socket.create(this.server, port);
			UniversalApp.socketServers[port] = this.socketServer;
			console.log(`Websocket server Listening on ${port}`);
		}
	}
}
const setupApps = async () => {
	const {
		masterThread
	} = utility;
	const type = masterThread ? 'master/' : 'client/';
	const dirApp = resolve(root, `./apps/${type}/`);
	console.log(`Loading Application Directory: ${dirApp}`);
	console.log(
		`${
			masterThread ?
				'Master Applications Initializing' :
				'Client Applications Initializing'
		}`,
	);
	const apps = await utility.shallowRequire(dirApp);
	if (!apps.length) {
		if (masterThread) {
			require('../cluster/master')(utility);
		}
		return;
	}
	const universalApp = async (appConfig) => {
		return new UniversalApp(appConfig);
	};
	await eachAsync(apps, async (item) => {
		if (item._directory.includes('!')) {
			console.log('IGNORE FOLDER', item);
			return false;
		} else {
			return universalApp(item);
		}
	});
	return {
		apps: UniversalApp.compiledApps,
		ports: UniversalApp.ports,
		servers: UniversalApp.servers
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
