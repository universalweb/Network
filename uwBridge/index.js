const utility = require('Acid');
const fs = require('fs');
const fsAsync = require('fs').promises;
const {
	client
} = require('./system/client');
const {
	resolve,
	join,
	normalize
} = require('path');
const watch = require('node-watch');
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
	stringify,
	getFileExtension
} = utility;
const root = __dirname;
const systemDirectory = resolve(root, './system/');
const cryptoUtility = require('../utilities/crypto');
const fileUtility = require('../utilities/file');
const consoleUtility = require('../utilities/console');
const certificateUtility = require('../utilities/certificate');
const certificatesUtility = require('../utilities/certificates');
const startsWithAssets = '/assets/';
const startsWithAssetsReplace = '/assets';
const startsWithWellKnown = '/.well-known/';
const startsWithWellKnownReplace = '/.well-known';
const startsWithRaw = '/raw/';
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
	push(body, channel = 'all', is_binary, compress) {
		const message = {
			body
		};
		const messageCompiled = stringify(message);
		return this.server.publish(channel, messageCompiled, is_binary, compress);
	}
	send(message, channel = 'all', is_binary, compress) {
		const messageCompiled = stringify(message);
		return this.server.publish(channel, messageCompiled, is_binary, compress);
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
	async notFound(response) {
		return response.status(404).send();
	}
	async handleRequest(host, indexPage, liveAssets, liveAssetsWellKnown, staticAssetsDirectory, publicDir, request, response) {
		const requestPath = request.path;
		console.log(request.headers['cf-connecting-ip'], requestPath);
		if (!request.headers['cf-connecting-ip']) {
			console.log('No CF header');
			return response.status(200).send();
		}
		if (request.headers.host !== host) {
			return response.status(403).send();
		}
		if (requestPath === '/') {
			return response.type('html').send(`${indexPage}<script>_realip='${request.headers['cf-connecting-ip']}'</script>`);
		}
		if (requestPath.startsWith(startsWithWellKnown)) {
			const file = liveAssetsWellKnown.get(requestPath.replace(startsWithWellKnownReplace, ''));
			if (file === undefined) {
				return this.notFound(response);
			}
			console.log(file.name === 'apple-app-site-association');
			response.header('content-type', 'application/json');
			return response.send(file.buffer);
		}
		if (requestPath.startsWith(startsWithAssets)) {
			const file = liveAssets.get(requestPath.replace(startsWithAssetsReplace, ''));
			if (file === undefined) {
				return this.notFound(response);
			}
			return response.type(file.extension).send(file.buffer);
		}
		if (requestPath.startsWith(startsWithRaw)) {
			const fileLocation = normalize(join(publicDir, requestPath));
			if (!fileLocation.includes(publicDir)) {
				return this.notFound(response);
			}
			try {
				const file = await fsAsync.readFile(fileLocation);
				console.log('SENDING', fileLocation);
				return response.type(getFileExtension(fileLocation)).send(file);
			} catch {
				return this.notFound(response);
			}
		}
		return response.type('html').send(`${indexPage}<script>_realip='${request.headers['cf-connecting-ip']}'</script>`);
	}
	async httpCreate() {
		const {
			config: {
				host,
				staticAssetsDirectory,
				publicDir,
				wellknownDirectory,
				server,
				http: {
					indexLocation,
				}
			}
		} = this;
		console.log(server);
		this.server = new serverCreator.Server(server);
		this.router = new serverCreator.Router();
		console.log(indexLocation);
		let indexPage = fs.readFileSync(indexLocation);
		this.indexPage = indexPage;
		watch(indexLocation, {}, async () => {
			indexPage = fs.readFileSync(indexLocation);
		});
		console.log(indexPage);
		const liveAssetsWellKnown = new LiveDirectory({
			path: wellknownDirectory,
			keep() {
				return true;
			}
		});
		await liveAssetsWellKnown.ready();
		console.log(liveAssetsWellKnown.files);
		const liveAssets = new LiveDirectory({
			path: staticAssetsDirectory,
			keep: {
				extensions: ['.css', '.html', '.js', '.json', '.csv', '.png', '.jpg', '.svg', '.woff2', '.woff', '.otf']
			},
			ignore: (path) => {
				return path.startsWith('.');
			}
		});
		await liveAssets.ready();
		this.LiveAssets = liveAssets;
		this.liveAssetsWellKnown = liveAssetsWellKnown;
		this.server.get('/*', async (request, response) => {
			return this.handleRequest(host, indexPage, liveAssets, liveAssetsWellKnown, staticAssetsDirectory, publicDir, request, response);
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
		config.staticAssetsDirectory = resolve(config.publicDir, `./assets/`);
		config.resourceDir = resolve(directory, `./filesystem/asset/`);
		config.wellknownDirectory = resolve(config.siteDir, `./public/.well-known/`);
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
			this.server.use('/', this.router);
			console.log(`Websocket server Listening on ${port}`);
		} catch (errorMessage) {
			console.log('Server Failed to start');
		}
	}
	setupWebSocketServer() {
		const {
			config: {
				websocket: {
					idle_timeout,
					max_payload_length
				}
			}
		} = this;
		this.router.upgrade('/ws', (request, response) => {
			console.log('query_parameters', request.query_parameters);
			const context = {
				ip: request.headers['cf-connecting-ip'],
				userAgent: request.headers['User-Agent']
			};
			if (request.query_parameters?.uuid) {
				context.uuid = request.query_parameters.uuid;
			}
			response.upgrade(context);
		});
		this.router.ws('/ws', {
			idle_timeout,
			max_payload_length
		}, (clientSocket) => {
			if (!clientSocket.context?.ip) {
				console.log('No CF header');
				return clientSocket.close();
			}
			if (!clientSocket.context?.uuid) {
				console.log('No uuid param given');
				return clientSocket.close();
			}
			console.log(clientSocket, `${clientSocket.context?.ip || clientSocket.ip} is now connected using websockets!`);
			console.log(`USER:${stringify(clientSocket.context)} is connected to the websocket`);
			client(clientSocket, this);
		});
	}
}
module.exports = async function(config) {
	return construct(uwBridge, [config]);
};

