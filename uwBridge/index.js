const utility = require('Acid');
const fs = require('fs');
const {
	client
} = require('./system/client');
const {
	resolve
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
} = utility;
const root = __dirname;
const systemDirectory = resolve(root, './system/');
const cryptoUtility = require('../utilities/crypto');
const fileUtility = require('../utilities/file');
const consoleUtility = require('../utilities/console');
const certificateUtility = require('../utilities/certificate');
const certificatesUtility = require('../utilities/certificates');
const assetsRegex = RegExp('/assets/');
const rawRegex = RegExp('/raw/');
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
	async handleRequest(indexPage, liveAssets, publicDir, request, response) {
		const requestPath = request.path;
		console.log(request.headers['cf-connecting-ip'], requestPath);
		if (!request.headers['cf-connecting-ip']) {
			console.log('No CF header');
			return response.status(200).send();
		}
		if (requestPath === '/') {
			return response.type('html').send(`${indexPage}<script>_realip='${request.headers['cf-connecting-ip']}'</script>`);
		}
		if (assetsRegex.test(requestPath)) {
			const file = liveAssets.get(requestPath);
			if (file === undefined) {
				return response.status(200).send();
			}
			return response.type(file.extension).send(file.buffer);
		} else if (rawRegex.test(requestPath)) {
			console.log(publicDir + requestPath);
			const fileCheck = await promise((accept) => {
				fs.stat(publicDir + requestPath, (err, stats) => {
					if (err) {
						return accept(false);
					}
					return accept(stats);
				  });
			});
			console.log('STREAMING FILE');
			if (fileCheck) {
				response.header('x-is-streamed', 'true');
				const use_chunked_encoding = request.headers['x-chunked-encoding'] === 'true';
				const stream = fs.createReadStream(publicDir + requestPath);
				return response.stream(stream, use_chunked_encoding ? undefined : fileCheck.size);
			} else {
				return response.status(404).send();
			}
		} else {
			return response.type('html').send(`${indexPage}<script>_realip='${request.headers['cf-connecting-ip']}'</script>`);
		}
	}
	async httpCreate() {
		const {
			config: {
				publicDir,
				server,
				http: {
					indexLocation
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
		const liveAssets = new LiveDirectory({
			path: publicDir,
			keep: {
				extensions: ['.css', '.html', '.js', '.json', '.csv', '.png', '.jpg', '.svg', '.woff2', '.woff', '.otf']
			},
			ignore: (path) => {
				return path.startsWith('.');
			}
		});
		await liveAssets.ready();
		this.LiveAssets = liveAssets;
		this.server.get('/*', async (request, response) => {
			return this.handleRequest(indexPage, liveAssets, publicDir, request, response);
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
			this.server.use('/', this.router);
			console.log(`Websocket server Listening on ${port}`);
		} catch (errorMessage) {
			console.log('Server Failed to start');
		}
	}
	setupWebSocketServer() {
		this.router.upgrade('/ws', (request, response) => {
			response.upgrade({
				ip: request.headers['cf-connecting-ip'],
			});
		});
		this.router.ws('/ws', {
			idle_timeout: 60,
			max_payload_length: 32 * 10024
		}, (clientSocket) => {
			if (!clientSocket.context?.ip) {
				console.log('No CF header');
				return clientSocket.close();
			}
			console.log(clientSocket, `${clientSocket.context?.ip || clientSocket.ip} is now connected using websockets!`);
			console.log(`user ${clientSocket.context} has connected to consume news events`);
			client(clientSocket, this);
		});
	}
}
module.exports = async function(config) {
	return construct(uwBridge, [config]);
};

