const utility = require('Acid');
const fs = require('fs');
const {
	client
} = require('./system/client');
const {
	resolve
} = require('path');
const serverCreator = require('hyper-express');
const LiveDirectory = require('live-directory');
const {
	assign,
	promise,
	construct,
	isPlainObject,
	each,
	ifInvoke,
	right,
} = utility;
const root = __dirname;
const systemDirectory = resolve(root, './system/');
const cryptoUtility = require('../utilities/crypto');
const fileUtility = require('../utilities/file');
const consoleUtility = require('../utilities/console');
const certificateUtility = require('../utilities/certificate');
const certificatesUtility = require('../utilities/certificates');
class uwBridge {
	constructor(config) {
		return promise(async (accept) => {
			assign(this.config, config);
			await this.compileDirectories(this);
			console.log(config);
			require('./system/plugin/directory/')(this);
			require('./system/plugin/watch/')(this);
			cryptoUtility(this);
			fileUtility(this);
			consoleUtility(this);
			certificateUtility(this);
			certificatesUtility(this);
			await this.initialization();
			accept(this);
		});
	}
	utility = utility;
	serverTimeoutDefault = 60000;
	config = {};
	client = {
		socketEvent: {}
	};
	clients = construct(Map);
	controller = {};
	model = {};
	scheme = {};
	system = {};
	serverCreator = serverCreator;
	push(channel = 'api', message, is_binary, compress) {
		return this.server.publish(channel, message, is_binary, compress);
	}
	send(channel = 'api', data, is_binary, compress) {
		let message;
		if (data.body) {
			message = data;
		} else {
			message = {
				body: message,
			};
		}
		return this.server.publish(channel, message, is_binary, compress);
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
		console.log(config.server);
		this.server = new serverCreator.Server(config.server);
		this.router = new serverCreator.Router();
		console.log(config.http.indexLocation);
		const indexPage = fs.readFileSync(config.http.indexLocation);
		console.log(indexPage);
		this.server.get('/', (request, response) => {
			response.type('html').send(indexPage);
		});
		const liveAssets = new LiveDirectory({
			path: config.publicDir,
			keep: {
				extensions: ['.css', '.html', '.js', '.json', '.csv', '.png', '.jpg', '.svg', '.woff2', '.woff', '.otf']
			},
			ignore: (path) => {
				return path.startsWith('.');
			}
		});
		this.LiveAssets = liveAssets;
		// liveAssets.on('file_reload', (file) => {
		// 	console.log(file.content.toString('utf8'));
		// });
		// Create static serve route to serve frontend assets
		this.server.get('/assets/*', (request, response) => {
			// Strip away '/assets' from the request path to get asset relative path
			// Lookup LiveFile instance from our LiveDirectory instance.
			const path = request.path;
			const file = liveAssets.get(path);
			console.log(path, file);
			// Return a 404 if no asset/file exists on the derived path
			if (file === undefined) {
				return response.status(404).send();
			}
			// Set appropriate mime-type and serve file buffer as response body
			return response.type(file.extension).send(file.buffer);
		});
		console.log('http service');
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
		try {
			const serverListen = await this.server.listen(port);
			this.serverListen = serverListen;
			console.log(`server Listening on ${port}`);
			this.setupWebSocketServer();
			console.log(`Websocket server Listening on ${port}`);
		} catch (errorMessage) {
			console.log('Server Failed to start');
		}
	}
	setupWebSocketServer() {
		this.router.ws('/ws', {
			idle_timeout: 60,
			max_payload_length: 32 * 1024
		}, (clientSocket) => {
			console.log(clientSocket, `${clientSocket.ip} is now connected using websockets!`);
			console.log(`user ${clientSocket.context} has connected to consume news events`);
			client(clientSocket, this);
		});
		this.server.use('/', this.router);
	}
}
module.exports = async function(config) {
	return construct(uwBridge, [config]);
};

