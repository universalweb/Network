// The Universal Web's UDSP server module
import {
	UniqID,
	assign,
	construct,
	currentPath,
	each,
	hasValue,
	isFunction,
	isNumber,
	isString,
	isTrue,
	isUndefined,
} from '@universalweb/utilitylib';
import {
	addClientCount,
	clientCheck,
	createServerClient,
	removeClient,
	subtractClientCount,
} from './methods/clients.js';
import { attachSocketEvents, configureNetwork, setPort } from './methods/network.js';
import { configureCertificateCryptography, setCertificate } from './methods/certificate.js';
import { decode, encode } from '#utilities/serialize';
import { introHeaderRPC, isIntroHeader } from '../rpc/headerRPC.js';
import { randomBuffer, toBase64 } from '#utilities/cryptography/utils';
import { UDSP } from '#udsp/base';
import { decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { defaultServerConnectionIdSize } from './defaults.js';
import { listen } from './methods/listen.js';
import { noStreamID } from '../utilities/hasConnectionID.js';
import { onError } from './methods/onError.js';
import { onListen } from './methods/onListen.js';
import { onPacket } from './methods/onPacket.js';
import { sendPacket } from '#udsp/utilities/sendPacket';
import { setDefaults } from '../client/methods/setDefaults.js';
const { seal } = Object;
/*
	* TODO:
 	* - Add flood protection for spamming new connections with the same connection id
 	* - Add flood protection for spamming new connections from the same origin
	* - Add new loadbalancer algo to distribute connections to servers equally
 */
export class Server extends UDSP {
	constructor(options) {
		super(options);
		return this.initialize(options);
	}
	async initialize(options) {
		await this.logBanner('SERVER INITIALIZING');
		await super.initialize(options);
		await super.setDefaults(options);
		await assign(this, options);
		this.options = options;
		await this.logInfo('UDSP', this.options);
		await this.configConnectionId();
		await this.setCertificate();
		await this.configureCertificateCryptography();
		await this.configureNetwork();
		await this.setupSocket();
		await this.attachSocketEvents();
		await this.logBanner('SERVER INITIALIZED');
		return this;
	}
	static description = 'UW Server Module';
	static type = 'server';
	isServer = true;
	isServerEnd = true;
	configureCertificateCryptography = configureCertificateCryptography;
	setCertificate = setCertificate;
	configConnectionId() {
		const {
			isWorker,
			coreCount,
		} = this;
		if (isFunction(this.id)) {
			this.id = this.id(this);
			return;
		}
		if (coreCount && this.workerId) {
			const reservedConnectionIdSize = String(coreCount).length;
			this.reservedConnectionIdSize = reservedConnectionIdSize;
			const compiledId = this.workerId.padStart(reservedConnectionIdSize, '0');
			this.id = compiledId;
		} else if (!this.id) {
			this.id = '0';
		}
		this.logInfo('Config Server ID', this.id);
	}
	async send(packet, destination) {
		return sendPacket(packet, this, this.socket, destination);
	}
	addClientCount = addClientCount;
	subtractClientCount = subtractClientCount;
	clientCheck = clientCheck;
	createClient = createServerClient;
	removeClient = removeClient;
	// NOTE: Server (receives raw packet)
	//    └─► parses + authenticates + identifies Client
	//          └─► Client.handlePacket(packet)
	//                └─► Client.server.handleRequest(packet)
	//                      └─► App.handleRequest(packet, client)
	//                            └─► Router.route(packet, client)
	async onRequest(request, response) {
		const { app } = this;
		this.logVerbose('onRequest EVENT', request);
		if (this.onServerRequest) {
			await this.onServerRequest(request, response, this);
		}
		if (app) {
			return app.onRequest(request, response, this);
		}
	}
	// TODO: Make this throttled - state doesn't have to be exact just near accurate for loadbalancing
	async updateWorkerState() {
		this.syncWorkerState();
	}
	// TODO: Make this throttled - state doesn't have to be exact just near accurate for loadbalancing
	async syncWorkerState() {
		const { clientCount } = this;
		this.logInfo(`Client count ${clientCount}`);
		process.send(await encode([
			'state',
			{
				clientCount,
			},
		]));
	}
	attachSocketEvents = attachSocketEvents;
	configureNetwork = configureNetwork;
	setPort = setPort;
	listen = listen;
	onError = onError;
	onListen = onListen;
	onPacket = onPacket;
	data = new Map();
	realTime = true;
	clientCount = 0;
	port = 8080;
	ip = '::1';
	connectionIdSize = defaultServerConnectionIdSize;
	/*
		* All created clients (clients) represent a client to server bi-directional connection until it is closed by either party.
	*/
	// SWITCH TO BINARY SEARCH FOR CLIENTS FOR FASTER LOOKUP
	clients = construct(Map);
	initialGracePeriod = 5000;
}
export async function server(...args) {
	return construct(Server, args);
}
